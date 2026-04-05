// ============================================================
// АСТРАЛ — Главный скрипт (assets/js/script.js)
// Версия: оптимизированная, все комментарии на русском языке
// Запускается один раз после полной загрузки страницы DOM
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    // ---- Вспомогательные утилиты ----
    // Сокращение для document.getElementById
    const $ = id => document.getElementById(id);
    // Читаем значение из localStorage и парсим JSON (возвращает null если нет)
    const lsGet = k => JSON.parse(localStorage.getItem(k) || "null");
    // Сохраняем значение в localStorage в виде JSON-строки
    const lsSet = (k, v) => localStorage.setItem(k, JSON.stringify(v));
    // Получаем массив всех зарегистрированных пользователей
    const getUsers = () => JSON.parse(localStorage.getItem("astral_users") || "[]");
    // Сохраняем обновлённый массив пользователей в localStorage
    const saveUsers = u => localStorage.setItem("astral_users", JSON.stringify(u));

    // ============================================================
    // 1. БУРГЕР-МЕНЮ (работает на всех страницах сайта)
    // ============================================================

    const sideMenu = $("sideMenu"), menuOverlay = $("menuOverlay");

    // Открываем боковое меню: добавляем класс "open" и показываем затемнение
    const openMenu = () => { sideMenu?.classList.add("open"); menuOverlay?.classList.add("active"); };

    // Закрываем боковое меню: убираем классы
    const closeMenu = () => { sideMenu?.classList.remove("open"); menuOverlay?.classList.remove("active"); };

    // Кнопка ☰ — открыть меню
    $("burgerBtn") && ($("burgerBtn").onclick = openMenu);
    // Кнопка ✕ внутри меню — закрыть
    $("closeMenuBtn") && ($("closeMenuBtn").onclick = closeMenu);
    // Клик по тёмному фону — тоже закрыть меню
    if (menuOverlay) menuOverlay.onclick = closeMenu;

    // ============================================================
    // 2. ЗАЩИТА ВХОДА В АДМИН-ПАНЕЛЬ (страница admin.html)
    // ============================================================

    // Блок с формой входа и блок с содержимым панели
    const adminOverlay = $("adminAuthOverlay"), adminContent = $("adminContent");
    if (adminOverlay && adminContent) {

        // Скрываем форму входа и показываем содержимое панели
        const showAdmin = () => { adminOverlay.style.display = "none"; adminContent.style.display = "block"; };

        // Если администратор уже залогинился в этой сессии — сразу показываем панель
        if (sessionStorage.getItem("astral_admin_auth") === "1") showAdmin();

        const adminBtn = $("adminLoginBtn");
        if (adminBtn) {
            adminBtn.onclick = () => {
                const l = $("adminLoginInput").value.trim();
                const p = $("adminPasswordInput").value.trim();
                const err = $("adminAuthError");
                if (err) err.innerHTML = "";

                // Проверяем логин и пароль — admin / admin
                if (l === "admin" && p === "admin") {
                    // Запоминаем авторизацию в sessionStorage (живёт до закрытия вкладки)
                    sessionStorage.setItem("astral_admin_auth", "1");
                    showAdmin();
                } else if (err) {
                    err.innerHTML = "Неверный логин или пароль";
                }
            };
            // Enter в поле пароля — имитирует нажатие кнопки входа
            $("adminPasswordInput")?.addEventListener("keypress", e => e.key === "Enter" && adminBtn.click());
        }
    }

    // ============================================================
    // 3. СТАТИСТИКА И РЕДАКТОР ГОРОСКОПА (страница admin.html)
    // ============================================================

    const adminUsersCount = $("adminUsersCount"), statsCount = $("statsCount");
    if (adminUsersCount || statsCount) {

        // Пересчитать и вывести счётчики пользователей и сохранённых пар
        const updateStats = () => {
            const users = getUsers();
            // Количество зарегистрированных пользователей
            if (adminUsersCount) adminUsersCount.innerText = users.length;
            // Суммарное число избранных пар по всем пользователям
            if (statsCount) statsCount.innerText = users.reduce((s, u) => s + (u.favorites?.length || 0), 0);
        };
        updateStats();

        // Кнопка "Очистить избранное у всех пользователей"
        const clearFavsBtn = $("clearFavoritesBtn");
        if (clearFavsBtn) clearFavsBtn.addEventListener("click", () => {
            if (!confirm("Вы уверены, что хотите очистить всё избранное у ВСЕХ пользователей?")) return;
            const users = getUsers();
            // Обнуляем массив favorites для каждого пользователя
            users.forEach(u => u.favorites = []);
            saveUsers(users);
            // Обновляем текущего залогиненного пользователя, если он есть
            const cu = lsGet("astral_current_user");
            if (cu) { cu.favorites = []; lsSet("astral_current_user", cu); }
            updateStats();
            alert("Все сохраненные союзы успешно удалены!");
        });

        // --- Редактор гороскопа для знаков зодиака ---
        const signEl = $("adminZodiacSign");

        // Суффиксы полей формы: adminHoroscopeStart, adminHoroscopeEnd, ...Text, ...Advice и т.д.
        const fKeys = ["Start", "End", "Text", "Advice", "Color", "Number"];
        // Соответствие суффикса HTML-поля → ключа в объекте данных localStorage
        const fMap = { Start: "dateStart", End: "dateEnd", Text: "text", Advice: "advice", Color: "color", Number: "number" };

        // Показать блок подтверждения на 3 секунды, затем скрыть
        const showFeedback = el => { if (!el) return; el.style.display = "block"; setTimeout(() => el.style.display = "none", 3000); };

        // Загружаем сохранённый гороскоп из localStorage в поля формы
        const loadHoroscope = () => {
            if (!signEl) return;
            // Ключ в localStorage: astral_horoscope_aries, astral_horoscope_leo и т.д.
            const c = lsGet("astral_horoscope_" + signEl.value) || {};
            fKeys.forEach(f => { const el = $("adminHoroscope" + f); if (el) el.value = c[fMap[f]] || ""; });
        };
        // При смене знака в select — обновляем форму
        if (signEl) { signEl.addEventListener("change", loadHoroscope); loadHoroscope(); }

        // Кнопка "Сохранить гороскоп" — записывает данные формы в localStorage
        $("saveHoroscopeBtn")?.addEventListener("click", () => {
            const text = ($("adminHoroscopeText")?.value || "").trim();
            if (!text) { alert("Основной прогноз не может быть пустым"); return; }
            const data = {};
            // Собираем значения всех полей в единый объект
            fKeys.forEach(f => { data[fMap[f]] = ($("adminHoroscope" + f)?.value || "").trim(); });
            lsSet("astral_horoscope_" + signEl.value, data);
            showFeedback($("adminHoroscopeFeedback"));
        });

        // Кнопка "Сбросить" — удаляет кастомный гороскоп из localStorage (вернётся стандартный)
        $("resetHoroscopeBtn")?.addEventListener("click", () => {
            if (!confirm("Сбросить гороскоп для этого знака до стандартного?")) return;
            localStorage.removeItem("astral_horoscope_" + signEl.value);
            loadHoroscope(); // форма очистится
            showFeedback($("adminHoroscopeReset"));
        });
    }

    // ============================================================
    // 4. КАЛЬКУЛЯТОР СОВМЕСТИМОСТИ (страница compatibility.html)
    // ============================================================

    const calcCompatBtn = $("calcCompat");
    if (calcCompatBtn) {

        // lastResult хранит текстовый итог последнего расчёта для сохранения в избранное
        let lastResult = "";
        // Загружаем текущего пользователя из localStorage
        let cu = lsGet("astral_current_user");
        // Если у пользователя ещё нет массива избранного — создаём
        if (cu && !cu.favorites) cu.favorites = [];

        // Показываем или скрываем предупреждение "нужно войти в аккаунт"
        const authWarning = $("authWarning");
        if (authWarning) authWarning.style.display = cu ? "none" : "block";

        const favContainer = $("favoritesList");

        // Шаблон HTML для одной строки избранного
        const favItemHtml = item => `<div class="favorite-item modern-fav-item"><div class="modern-fav-icon"><i class="fas fa-star"></i></div><div class="modern-fav-content"><div class="modern-fav-text">${item}</div></div></div>`;
        // Заглушка, если список избранного пуст
        const emptyFavHtml = "<div class=\"empty-fav\"><i class=\"fas fa-cloud-moon\" style=\"font-size:2rem;color:rgba(255,255,255,0.2);margin-bottom:10px;\"></i><p>У вас пока нет сохраненных пар.</p></div>";

        // Перерисовываем список сохранённых пар из массива favorites
        const renderFavs = () => {
            if (!favContainer) return;
            favContainer.innerHTML = cu?.favorites?.length ? cu.favorites.map(favItemHtml).join("") : emptyFavHtml;
        };
        renderFavs(); // первичная отрисовка при загрузке страницы

        // Таблица вердиктов совместимости: [минимальный %, заголовок, описание]
        // Первый найденный вердикт, у которого порог < полученного процента, используется как результат
        const verdicts = [
            [80, "Идеальная синергия", "Ваши звезды выстроены в безупречный узор. Этот союз обладает огромным потенциалом для глубоких чувств и взаимопонимания."],
            [60, "Благоприятный союз", "Между вами есть сильное притяжение. При должном внимании и уважении друг к другу вы сможете создать гармоничную пару."],
            [40, "Астрологический компромисс", "Ваши энергии часто сталкиваются. Это может быть как мощной страстью, так и причиной разногласий — всё зависит от вашей мудрости."],
            [-1, "Сложное взаимодействие", "Звезды указывают на различия в характерах. Вам потребуется много терпения и желания понимать друг друга, чтобы обрести гармонию."]
        ];

        // Кнопка "Рассчитать" — генерирует псевдослучайный результат совместимости
        calcCompatBtn.onclick = () => {
            const n1 = $("name1").value.trim(), n2 = $("name2").value.trim();
            if (!n1 || !n2) { alert("Введите оба имени"); return; }

            // Псевдослучайный процент совместимости от 20 до 80
            const pct = Math.floor(Math.random() * 61) + 20;
            // Выбираем подходящий вердикт по таблице
            const [, title, desc] = verdicts.find(([min]) => pct > min);
            // Сохраняем строку результата для возможного добавления в избранное
            lastResult = `${n1} и ${n2} — ${pct}% совместимости. ${title}`;

            // Рендерим блок с результатом в HTML
            const resArea = $("resultArea");
            if (resArea) resArea.innerHTML = `<div class="editorial-result"><div class="ed-res-names">${n1} <span class="ed-res-amp">&</span> ${n2}</div><div class="ed-res-score"><span class="ed-res-num">${pct}</span><span class="ed-res-pct">%</span></div><div class="ed-res-text"><h4>${title}</h4><p>${desc}</p></div></div>`;

            // Показываем кнопку "Сохранить в избранное" только после расчёта
            const sb = $("saveToFav"); if (sb) sb.style.display = "inline-block";
        };

        // Кнопка "Сохранить в избранное"
        const stf = $("saveToFav");
        if (stf) stf.onclick = () => {
            if (!cu) { alert("Войдите в аккаунт, чтобы сохранять избранное"); return; }
            if (!lastResult) { alert("Сначала рассчитайте совместимость"); return; }
            if (cu.favorites.includes(lastResult)) { alert("Уже в избранном"); return; }

            // Добавляем результат в массив избранного и сохраняем
            cu.favorites.push(lastResult);
            lsSet("astral_current_user", cu);

            // Синхронизируем с общим массивом пользователей (для статистики в админке)
            const all = getUsers(), idx = all.findIndex(u => u.email === cu.email);
            if (idx !== -1) { all[idx].favorites = cu.favorites; saveUsers(all); }
            renderFavs();
            alert("Сохранено в избранное!");
        };
    }

    // ============================================================
    // 5. ГОРОСКОП (страница horoscope.html)
    // ============================================================

    const horoscopeResult = $("horoscopeResult");
    if (document.querySelector(".zodiac-card")) {

        // Базовый справочник гороскопов: используется если администратор
        // не задал кастомный текст через редактор в admin.html
        const H = {
            aries:       { name: "Овен",      text: "Сегодня звёзды благосклонны к вашим начинаниям. Энергия будет бить ключом, используйте её для важных дел. Не бойтесь проявлять инициативу — она будет вознаграждена. Вечером уделите время отдыху, чтобы восстановить силы.", advice: "Действуйте смело, но не забывайте о планировании", color: "Красный", number: "1, 9" },
            taurus:      { name: "Телец",     text: "День благоприятен для финансовых вопросов и укрепления отношений. Ваша настойчивость поможет достичь целей. Уделите внимание домашнему уюту и близким людям. Возможны приятные сюрпризы.", advice: "Будьте открыты к новым возможностям", color: "Зелёный", number: "6, 15" },
            gemini:      { name: "Близнецы",  text: "Отличный день для общения и новых знакомств. Ваша коммуникабельность поможет решить давние вопросы. Избегайте сплетен и пустых разговоров. Сосредоточьтесь на важных делах.", advice: "Слушайте больше, чем говорите", color: "Жёлтый", number: "5, 14" },
            cancer:      { name: "Рак",       text: "Сегодня важно прислушиваться к своей интуиции. Эмоциональная чувствительность может быть обострена. Посвятите время семье и дому. Не принимайте поспешных решений — дайте себе время подумать.", advice: "Доверьтесь своим чувствам", color: "Серебристый", number: "2, 7" },
            leo:         { name: "Лев",       text: "Ваша харизма сегодня на высоте! Это идеальный день для самопрезентации и творчества. Не бойтесь быть в центре внимания. Возможны приятные комплименты и признание заслуг.", advice: "Сияйте, но не затмевайте других", color: "Золотой", number: "1, 4" },
            virgo:       { name: "Дева",      text: "День подходит для анализа и планирования. Ваша внимательность к деталям поможет избежать ошибок. Займитесь делами, требующими сосредоточенности. Вечером позвольте себе расслабиться.", advice: "Перфекционизм сегодня ваш союзник", color: "Бежевый", number: "3, 12" },
            libra:       { name: "Весы",      text: "Гармония и баланс — ключевые слова дня. Удачное время для переговоров и урегулирования конфликтов. Обратите внимание на эстетику и красоту вокруг. Возможны романтические встречи.", advice: "Ищите золотую середину", color: "Розовый", number: "6, 15" },
            scorpio:     { name: "Скорпион",  text: "Сегодня ваша проницательность будет особенно остра. День подходит для глубоких размышлений и трансформаций. Не бойтесь перемен — они приведут к росту. Будьте осторожны с финансами.", advice: "Доверяйте интуиции", color: "Тёмно-красный", number: "9, 18" },
            sagittarius: { name: "Стрелец",   text: "Отличный день для путешествий и новых горизонтов. Ваш оптимизм заразителен. Расширяйте кругозор, изучайте что-то новое. Избегайте излишней поспешности в решениях.", advice: "Стремитесь к новым вершинам", color: "Фиолетовый", number: "3, 12" },
            capricorn:   { name: "Козерог",   text: "День благоприятен для карьерных вопросов и достижения целей. Ваша дисциплина приведёт к успеху. Уделите время долгосрочному планированию. Возможно получение важной информации.", advice: "Шаг за шагом к вершине", color: "Тёмно-синий", number: "8, 17" },
            aquarius:    { name: "Водолей",   text: "Сегодня ваша оригинальность будет в центре внимания. День подходит для нестандартных решений и экспериментов. Общайтесь с единомышленниками. Новые идеи могут принести успех.", advice: "Будьте собой, это ваша сила", color: "Голубой", number: "4, 13" },
            pisces:      { name: "Рыбы",      text: "День творчества и вдохновения. Ваша чувствительность поможет понять других. Займитесь искусством или медитацией. Избегайте иллюзий — смотрите на вещи реально. Возможны приятные сюрпризы.", advice: "Творите и мечтайте", color: "Морская волна", number: "7, 16" }
        };

        // Выводим текущую дату в блок "Прогноз на..."
        const ud = $("updateDate");
        if (ud) ud.innerHTML = `📅 Прогноз на ${new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}`;

        // Отобразить прогноз для выбранного знака зодиака
        const showHoroscope = sign => {
            const d = H[sign]; if (!d || !horoscopeResult) return;

            // Если в localStorage есть кастомный текст от администратора — используем его,
            // иначе берём базовый из справочника H
            const c = lsGet("astral_horoscope_" + sign) || {};
            $("selectedSign").innerHTML = `<i class="fas fa-star"></i> ${d.name}`;
            $("horoscopeText").innerHTML = c.text || d.text;
            $("adviceText").innerHTML = c.advice || d.advice;
            $("colorText").innerHTML = c.color || d.color;
            $("numberText").innerHTML = c.number || d.number;

            // Если администратор указал диапазон дат — показываем его
            const dateEl = $("horoscopeDate");
            if (dateEl) {
                if (c.dateStart && c.dateEnd) {
                    // Форматируем дату: "1 января" без года
                    const fmt = x => new Date(x + "T00:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
                    dateEl.textContent = `${fmt(c.dateStart)} — ${fmt(c.dateEnd)}`;
                    dateEl.style.display = "block";
                } else dateEl.style.display = "none";
            }

            // Показываем блок результата и плавно прокручиваем к нему
            horoscopeResult.style.display = "block";
            horoscopeResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
        };

        // Навешиваем обработчик клика на каждую карточку знака зодиака
        const cards = document.querySelectorAll(".zodiac-card");
        cards.forEach(card => card.addEventListener("click", function () {
            // Снимаем выделение у всех карточек и выделяем текущую
            cards.forEach(c => c.classList.remove("selected"));
            this.classList.add("selected");
            showHoroscope(this.dataset.sign);
        }));
    }

    // ============================================================
    // 6. СЛАЙДЕР SWIPER (главная страница index.html)
    // ============================================================

    // Инициализируем слайдер только если он присутствует на странице и Swiper загружен
    if (document.querySelector(".astrologySwiper") && typeof Swiper !== "undefined") {
        new Swiper(".astrologySwiper", {
            loop: true, // бесконечная прокрутка
            autoplay: { delay: 4000, disableOnInteraction: false }, // автосмена каждые 4 сек
            pagination: { el: ".swiper-pagination", clickable: true }, // точки снизу
            navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" }, // стрелки
            spaceBetween: 0,
            slidesPerView: 1,
            speed: 600 // скорость анимации перехода в мс
        });
    }

    // ============================================================
    // 7. КНОПКА АВТОРИЗАЦИИ В ШАПКЕ (динамически меняется)
    // ============================================================

    // Если пользователь залогинен — показываем иконку профиля,
    // иначе — иконку входа. Ссылки тоже меняются соответственно.
    const authBtn = $("authBtn"), menuAuth = $("menuAuthLink");
    if (authBtn || menuAuth) {
        const logged = !!localStorage.getItem("astral_current_user");
        if (authBtn) {
            authBtn.innerHTML = logged ? "<i class=\"fas fa-user-astronaut\"></i>" : "<i class=\"fas fa-user\"></i>";
            authBtn.href = logged ? "profile.html" : "login.html";
        }
        if (menuAuth) {
            menuAuth.innerHTML = logged ? "<i class=\"fas fa-id-card\"></i> Личный кабинет" : "<i class=\"fas fa-sign-in-alt\"></i> Авторизация";
            menuAuth.href = logged ? "profile.html" : "login.html";
        }
    }

    // ============================================================
    // 8. ФОРМА ВХОДА (страница login.html)
    // ============================================================

    const loginBtn = $("loginBtn");
    if (loginBtn) {
        loginBtn.onclick = () => {
            const email = $("loginEmail").value.trim();
            const pass = $("loginPassword").value.trim();
            const err = $("loginError");
            if (err) err.innerHTML = "";

            // Простая валидация: поля не должны быть пустыми
            if (!email || !pass) { if (err) err.innerHTML = "Заполните все поля"; return; }

            // Ищем пользователя с совпадающим email и паролем в localStorage
            const user = getUsers().find(u => u.email === email && u.password === pass);

            if (user) {
                // Авторизация успешна: сохраняем пользователя и переходим в профиль
                lsSet("astral_current_user", user);
                location.href = "profile.html";
            } else if (err) {
                err.innerHTML = "Неверный email или пароль";
            }
        };
        // Enter в поле пароля = клик по кнопке
        $("loginPassword")?.addEventListener("keypress", e => e.key === "Enter" && loginBtn.click());
    }

    // ============================================================
    // 9. ЛИЧНЫЙ КАБИНЕТ (страница profile.html)
    // ============================================================

    const userBlock = $("userBlock");
    if (userBlock) {
        const saved = lsGet("astral_current_user");
        // Если пользователь не залогинен — перенаправляем на страницу входа
        if (!saved) { location.href = "login.html"; return; }

        userBlock.style.display = "flex";

        // Символы знаков зодиака в текстовом формате (без эмодзи-режима через \uFE0E)
        const zIcons = {
            aries: "♈&#xFE0E;", taurus: "♉&#xFE0E;", gemini: "♊&#xFE0E;",
            cancer: "♋&#xFE0E;", leo: "♌&#xFE0E;", virgo: "♍&#xFE0E;",
            libra: "♎&#xFE0E;", scorpio: "♏&#xFE0E;", sagittarius: "♐&#xFE0E;",
            capricorn: "♑&#xFE0E;", aquarius: "♒&#xFE0E;", pisces: "♓&#xFE0E;"
        };

        // Аватар: символ знака зодиака пользователя или иконка луны по умолчанию
        const av = document.querySelector(".premium-avatar");
        if (av) av.innerHTML = saved.zodiac
            ? `<span>${zIcons[saved.zodiac] || "<i class=\"fas fa-moon\"></i>"}</span>`
            : "<i class=\"fas fa-moon\"></i>";

        // Заполняем данные профиля
        const pn = $("profileName"), pe = $("profileEmail"), pd = $("profileDate");
        if (pn) pn.innerText = saved.name || "Не указано";
        if (pe) pe.innerText = saved.email || "Не указано";
        if (pd && saved.registeredAt) pd.innerText = new Date(saved.registeredAt).toLocaleDateString("ru-RU");

        // Список сохранённых пар совместимости
        const favs = saved.favorites || [], fc = $("favCount"), fl = $("favoritesList");
        if (fc) fc.innerText = favs.length; // счётчик в заголовке

        // Шаблон карточки избранного (идентичен compatibility.html)
        const favItemHtml = item => `<div class="favorite-item modern-fav-item"><div class="modern-fav-icon"><i class="fas fa-star"></i></div><div class="modern-fav-content"><div class="modern-fav-text">${item}</div></div></div>`;
        if (fl) fl.innerHTML = favs.length
            ? favs.map(favItemHtml).join("")
            : "<div class=\"empty-fav\"><i class=\"fas fa-cloud-moon\" style=\"font-size:2rem;color:rgba(255,255,255,0.2);margin-bottom:10px;\"></i><p>У вас пока нет сохраненных пар.</p></div>";

        // Кнопка "Выйти из аккаунта"
        const logoutBtn = $("logoutBtn");
        if (logoutBtn) logoutBtn.onclick = () => {
            if (confirm("Выйти из аккаунта?")) {
                localStorage.removeItem("astral_current_user");
                location.href = "index.html";
            }
        };
    }

    // ============================================================
    // 10. ФОРМА РЕГИСТРАЦИИ (страница register.html)
    // ============================================================

    const regBtn = $("registerBtn");
    if (regBtn) {
        regBtn.onclick = () => {
            const name = $("regName").value.trim();
            const email = $("regEmail").value.trim();
            const pass = $("regPassword").value.trim();
            const zodiac = $("regZodiac").value;
            const err = $("registerError"), ok = $("registerSuccess");
            if (err) err.innerHTML = ""; if (ok) ok.innerHTML = "";

            // Валидация: все поля обязательны
            if (!name || !email || !pass || !zodiac) { if (err) err.innerHTML = "Заполните все поля, включая знак зодиака"; return; }
            // Простая проверка email — должна быть @ в строке
            if (!email.includes("@")) { if (err) err.innerHTML = "Введите корректный email"; return; }
            // Минимальная длина пароля
            if (pass.length < 4) { if (err) err.innerHTML = "Пароль должен быть не менее 4 символов"; return; }

            const users = getUsers();
            // Проверяем уникальность email
            if (users.find(u => u.email === email)) { if (err) err.innerHTML = "Этот email уже зарегистрирован"; return; }

            // Создаём нового пользователя и сохраняем
            users.push({ name, email, password: pass, zodiac, registeredAt: new Date().toISOString(), favorites: [] });
            saveUsers(users);
            if (ok) ok.innerHTML = "✅ Регистрация успешна! Перенаправляем на страницу входа...";
            // Через 1.5 секунды переходим на страницу входа
            setTimeout(() => location.href = "login.html", 1500);
        };
        // Enter в поле пароля = клик по кнопке
        $("regPassword")?.addEventListener("keypress", e => e.key === "Enter" && regBtn.click());
    }

    // ============================================================
    // 11. КАЛЬКУЛЯТОР СУДЬБЫ (страница destiny.html)
    // ============================================================

    const destBtn = $("calcDestinyBtn");
    if (destBtn) {
        destBtn.onclick = () => {
            const name = $("destName").value.trim();
            const date = $("destDate").value;
            const moon = $("destMoon").value;
            if (!name || !date || !moon) { alert("Пожалуйста, заполните необходимые данные для точного астрологического оттиска."); return; }

            // Справочник фаз луны: каждая фаза имеет название, описание и иконку
            const moonData = {
                "new":    { title: "Дитя Новолуния",    text: "Вы рождены в момент обнуления энергий. У вас есть редкий дар начинать с чистого листа, предвидеть тренды и быть первооткрывателем. Вам комфортно в тени до тех пор, пока вы не подготовите свой звездный час.", icon: "fa-circle" },
                "waxing": { title: "Энергия Роста",     text: "Рожденные на растущую луну наделены огромным созидательным потенциалом. Вы — строитель своей судьбы. Вам легко даются проекты, требующие упорства, веры и накопления ресурсов.", icon: "fa-adjust" },
                "full":   { title: "Свет Полнолуния",   text: "Вы родились на пике активности ночного светила. Ваша аура притягательна и порой загадочна. Вас отличает высокая эмоциональность, обостренная интуиция и мощный уровень эмпатии.", icon: "fa-circle" },
                "waning": { title: "Мудрость Убывания", text: "Ваша душа гораздо старше вашего физического возраста. Вы обладаете склонностью к самоанализу, эзотерике и глубокому осмыслению мира. Ваша сила — в умении отпускать.", icon: "fa-moon" }
            };

            // Кармические пути — определяются по длине имени
            const paths = [
                "Мистический странник: Ваш путь лежит через изучение тайн и передачу знаний другим.",
                "Творец реальности: Ваша миссия — создавать гармонию через искусство и эстетику.",
                "Воин света: Вам суждено разрушать стереотипы и вести людей за собой к правде.",
                "Хранитель баланса: Ваша истинная сила — в умении находить компромиссы в бурях."
            ];

            // Высший дар — определяется по сумме длин имени и даты
            const gifts = [
                "Дар предчувствия событий за несколько мгновений до их наступления.",
                "Способность исцелять словом, успокаивая чужие тревоги и страхи.",
                "Интуитивное чтение истинных мотивов людей сквозь любые маски.",
                "Притяжение удачной череды случайностей везде, куда бы вы ни пошли."
            ];

            const m = moonData[moon], ra = $("destinyResultArea");
            // Формируем HTML с результатом: фаза луны + кармический путь + высший дар
            if (ra) ra.innerHTML = `<div class="editorial-result" style="margin-top:1.5rem;text-align:center;"><div class="ed-res-names" style="margin-bottom:1rem;">${name}</div><div class="ed-res-score" style="margin-bottom:0;"><span class="ed-res-pct" style="font-size:1rem;letter-spacing:3px;border-bottom:1px solid #daa520;padding-bottom:5px;">ЗВЁЗДНЫЙ ПАСПОРТ ОТКРЫТ</span></div><div class="destiny-grid"><div class="destiny-trait full-width"><div class="destiny-trait-icon"><i class="fas ${m.icon}"></i></div><h5>${m.title}</h5><p>${m.text}</p></div><div class="destiny-trait"><div class="destiny-trait-icon"><i class="fas fa-route"></i></div><h5>Кармический Путь</h5><p>${paths[name.length % 4]}</p></div><div class="destiny-trait"><div class="destiny-trait-icon"><i class="fas fa-gift"></i></div><h5>Высший Дар</h5><p>${gifts[(name.length + date.length) % 4]}</p></div></div></div>`;
        };
    }

    // ============================================================
    // 12. ФИЛЬТРАЦИЯ КАРТ ТАРО ПО ВКЛАДКАМ (страница tarot.html)
    // ============================================================

    const tarotTabs = document.querySelectorAll(".tarot-tab");
    if (tarotTabs.length) {
        const cats = document.querySelectorAll(".tarot-category");
        tarotTabs.forEach(tab => tab.addEventListener("click", () => {
            // Снимаем активный класс со всех вкладок и ставим на текущую
            tarotTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            // Показываем только категории, соответствующие выбранному фильтру
            // При выборе "Все" — показываем всё
            cats.forEach(c => c.style.display = (tab.dataset.filter === "all" || c.dataset.category === tab.dataset.filter) ? "block" : "none");
        }));
    }

}); // конец DOMContentLoaded
