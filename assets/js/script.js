document.addEventListener("DOMContentLoaded", () => {
    // --- 1. Global: Burger Menu ---
    const burger = document.getElementById("burgerBtn");
    const sideMenu = document.getElementById("sideMenu");
    const overlay = document.getElementById("menuOverlay");
    const closeBtn = document.getElementById("closeMenuBtn");
    
    function openMenu() {
        if(sideMenu) sideMenu.classList.add("open");
        if(overlay) overlay.classList.add("active");
    }
    function closeMenu() {
        if(sideMenu) sideMenu.classList.remove("open");
        if(overlay) overlay.classList.remove("active");
    }
    
    if (burger) burger.onclick = openMenu;
    if (closeBtn) closeBtn.onclick = closeMenu;
    if (overlay) overlay.onclick = closeMenu;

    // --- 2. Shared Utilities ---
    function getUsers() {
        return JSON.parse(localStorage.getItem('astral_users') || '[]');
    }

    // --- 3. Page-Specific: Admin ---
    const adminUsersCount = document.getElementById("adminUsersCount");
    const statsCount = document.getElementById("statsCount");

    if (adminUsersCount || statsCount) {
        function updateStats() {
            const users = getUsers();
            if (adminUsersCount) {
                adminUsersCount.innerText = users.length;
            }
            if (statsCount) {
                let totalFavs = 0;
                users.forEach(u => {
                    if (u.favorites) totalFavs += u.favorites.length;
                });
                statsCount.innerText = totalFavs;
            }
        }
        updateStats();

        const clearFavs = document.getElementById("clearFavoritesBtn");
        if (clearFavs) {
            clearFavs.addEventListener("click", () => {
                if (confirm("Вы уверены, что хотите очистить всё избранное у ВСЕХ пользователей?")) {
                    const users = getUsers();
                    users.forEach(u => u.favorites = []);
                    localStorage.setItem('astral_users', JSON.stringify(users));
                    
                    const currentUser = JSON.parse(localStorage.getItem('astral_current_user'));
                    if (currentUser) {
                        currentUser.favorites = [];
                        localStorage.setItem('astral_current_user', JSON.stringify(currentUser));
                    }
                    
                    updateStats();
                    alert("Все сохраненные союзы успешно удалены!");
                }
            });
        }
        
        // Horoscope Editor Logic
        const adminZodiacSign = document.getElementById("adminZodiacSign");
        const adminHoroscopeStart = document.getElementById("adminHoroscopeStart");
        const adminHoroscopeEnd = document.getElementById("adminHoroscopeEnd");
        const adminHoroscopeText = document.getElementById("adminHoroscopeText");
        const adminHoroscopeAdvice = document.getElementById("adminHoroscopeAdvice");
        const adminHoroscopeColor = document.getElementById("adminHoroscopeColor");
        const adminHoroscopeNumber = document.getElementById("adminHoroscopeNumber");
        const saveHoroscopeBtn = document.getElementById("saveHoroscopeBtn");
        const resetHoroscopeBtn = document.getElementById("resetHoroscopeBtn");
        const adminHoroscopeFeedback = document.getElementById("adminHoroscopeFeedback");
        const adminHoroscopeReset = document.getElementById("adminHoroscopeReset");

        function showAdminFeedback(el, duration) {
            if (!el) return;
            el.style.display = 'block';
            setTimeout(() => { el.style.display = 'none'; }, duration || 3000);
        }
        
        function loadHoroscopeForEdit() {
            if (!adminZodiacSign) return;
            const sign = adminZodiacSign.value;
            const custom = JSON.parse(localStorage.getItem('astral_horoscope_' + sign));
            
            if (custom) {
                if (adminHoroscopeStart) adminHoroscopeStart.value = custom.dateStart || '';
                if (adminHoroscopeEnd) adminHoroscopeEnd.value = custom.dateEnd || '';
                if (adminHoroscopeText) adminHoroscopeText.value = custom.text || '';
                if (adminHoroscopeAdvice) adminHoroscopeAdvice.value = custom.advice || '';
                if (adminHoroscopeColor) adminHoroscopeColor.value = custom.color || '';
                if (adminHoroscopeNumber) adminHoroscopeNumber.value = custom.number || '';
            } else {
                if (adminHoroscopeStart) adminHoroscopeStart.value = '';
                if (adminHoroscopeEnd) adminHoroscopeEnd.value = '';
                if (adminHoroscopeText) adminHoroscopeText.value = '';
                if (adminHoroscopeAdvice) adminHoroscopeAdvice.value = '';
                if (adminHoroscopeColor) adminHoroscopeColor.value = '';
                if (adminHoroscopeNumber) adminHoroscopeNumber.value = '';
            }
        }

        if (adminZodiacSign) {
            adminZodiacSign.addEventListener('change', loadHoroscopeForEdit);
            loadHoroscopeForEdit();
        }

        if (saveHoroscopeBtn) {
            saveHoroscopeBtn.addEventListener('click', () => {
                const sign = adminZodiacSign.value;
                const dateStart = adminHoroscopeStart ? adminHoroscopeStart.value : '';
                const dateEnd = adminHoroscopeEnd ? adminHoroscopeEnd.value : '';
                const text = adminHoroscopeText ? adminHoroscopeText.value.trim() : '';
                const advice = adminHoroscopeAdvice ? adminHoroscopeAdvice.value.trim() : '';
                const color = adminHoroscopeColor ? adminHoroscopeColor.value.trim() : '';
                const number = adminHoroscopeNumber ? adminHoroscopeNumber.value.trim() : '';
                
                if (!text) {
                    alert('Основной прогноз не может быть пустым');
                    return;
                }
                
                const data = { dateStart, dateEnd, text, advice, color, number };
                localStorage.setItem('astral_horoscope_' + sign, JSON.stringify(data));
                showAdminFeedback(adminHoroscopeFeedback, 3000);
            });
        }

        if (resetHoroscopeBtn) {
            resetHoroscopeBtn.addEventListener('click', () => {
                if (!confirm('Сбросить гороскоп для этого знака до стандартного?')) return;
                const sign = adminZodiacSign.value;
                localStorage.removeItem('astral_horoscope_' + sign);
                loadHoroscopeForEdit();
                showAdminFeedback(adminHoroscopeReset, 3000);
            });
        }
    }

    // --- 4. Page-Specific: Compatibility ---
    const calcCompatBtn = document.getElementById('calcCompat');
    if (calcCompatBtn) {
        let lastResult = "";
        let currentUserCompat = null;
        const savedUser = localStorage.getItem('astral_current_user');
        
        if (savedUser) {
            currentUserCompat = JSON.parse(savedUser);
            if (!currentUserCompat.favorites) currentUserCompat.favorites = [];
            const authWarning = document.getElementById('authWarning');
            if (authWarning) authWarning.style.display = 'none';
        } else {
            const authWarning = document.getElementById('authWarning');
            if (authWarning) authWarning.style.display = 'block';
        }
        
        function showFavoritesCompat() {
            const container = document.getElementById('favoritesList');
            if (!container) return;
            if (!currentUserCompat || !currentUserCompat.favorites || currentUserCompat.favorites.length === 0) {
                container.innerHTML = '<div class="empty-fav"><i class="fas fa-cloud-moon" style="font-size: 2rem; color: rgba(255,255,255,0.2); margin-bottom: 10px;"></i><p>У вас пока нет сохраненных пар.</p></div>';
                return;
            }
            container.innerHTML = currentUserCompat.favorites.map(item => `
                <div class="favorite-item modern-fav-item">
                    <div class="modern-fav-icon"><i class="fas fa-star"></i></div>
                    <div class="modern-fav-content">
                        <div class="modern-fav-text">${item}</div>
                    </div>
                </div>
            `).join('');
        }
        showFavoritesCompat();
        
        calcCompatBtn.onclick = () => {
            let name1 = document.getElementById('name1').value.trim();
            let name2 = document.getElementById('name2').value.trim();
            if (!name1 || !name2) {
                alert('Введите оба имени');
                return;
            }
            let percent = Math.floor(Math.random() * 61) + 20;
            
            let verdictTitle = '';
            let verdictDesc = '';
            if (percent > 80) {
                verdictTitle = 'Идеальная синергия';
                verdictDesc = 'Ваши звезды выстроены в безупречный узор. Этот союз обладает огромным потенциалом для глубоких чувств и взаимопонимания.';
            } else if (percent > 60) {
                verdictTitle = 'Благоприятный союз';
                verdictDesc = 'Между вами есть сильное притяжение. При должном внимании и уважении друг к другу вы сможете создать гармоничную пару.';
            } else if (percent > 40) {
                verdictTitle = 'Астрологический компромисс';
                verdictDesc = 'Ваши энергии часто сталкиваются. Это может быть как мощной страстью, так и причиной разногласий — всё зависит от вашей мудрости.';
            } else {
                verdictTitle = 'Сложное взаимодействие';
                verdictDesc = 'Звезды указывают на различия в характерах. Вам потребуется много терпения и желания понимать друг друга, чтобы обрести гармонию.';
            }
            
            lastResult = `${name1} и ${name2} — ${percent}% совместимости. ${verdictTitle}`;
            
            const resArea = document.getElementById('resultArea');
            if (resArea) {
                resArea.innerHTML = `
                    <div class="editorial-result">
                        <div class="ed-res-names">${name1} <span class="ed-res-amp">&</span> ${name2}</div>
                        <div class="ed-res-score">
                            <span class="ed-res-num">${percent}</span><span class="ed-res-pct">%</span>
                        </div>
                        <div class="ed-res-text">
                            <h4>${verdictTitle}</h4>
                            <p>${verdictDesc}</p>
                        </div>
                    </div>
                `;
            }
            
            const saveBtn = document.getElementById('saveToFav');
            if (saveBtn) saveBtn.style.display = 'inline-block';
        };
        
        const saveToFav = document.getElementById('saveToFav');
        if (saveToFav) saveToFav.onclick = () => {
            if (!currentUserCompat) {
                alert('Войдите в аккаунт, чтобы сохранять избранное');
                return;
            }
            if (!lastResult) {
                alert('Сначала рассчитайте совместимость');
                return;
            }
            if (!currentUserCompat.favorites.includes(lastResult)) {
                currentUserCompat.favorites.push(lastResult);
                localStorage.setItem('astral_current_user', JSON.stringify(currentUserCompat));

                // Синхронизируем с astral_users, чтобы счётчик в админке работал корректно
                const allUsers = getUsers();
                const idx = allUsers.findIndex(u => u.email === currentUserCompat.email);
                if (idx !== -1) {
                    allUsers[idx].favorites = currentUserCompat.favorites;
                    localStorage.setItem('astral_users', JSON.stringify(allUsers));
                }

                showFavoritesCompat();
                alert('Сохранено в избранное!');
            } else {
                alert('Уже в избранном');
            }
        };
    }

    // --- 5. Page-Specific: Horoscope ---
    const horoscopeResult = document.getElementById('horoscopeResult');
    if (document.querySelector('.zodiac-card')) {
        const horoscopes = {
            aries: { name: "Овен", text: "Сегодня звёзды благосклонны к вашим начинаниям. Энергия будет бить ключом, используйте её для важных дел. Не бойтесь проявлять инициативу — она будет вознаграждена. Вечером уделите время отдыху, чтобы восстановить силы.", advice: "Действуйте смело, но не забывайте о планировании", color: "Красный", number: "1, 9" },
            taurus: { name: "Телец", text: "День благоприятен для финансовых вопросов и укрепления отношений. Ваша настойчивость поможет достичь целей. Уделите внимание домашнему уюту и близким людям. Возможны приятные сюрпризы.", advice: "Будьте открыты к новым возможностям", color: "Зелёный", number: "6, 15" },
            gemini: { name: "Близнецы", text: "Отличный день для общения и новых знакомств. Ваша коммуникабельность поможет решить давние вопросы. Избегайте сплетен и пустых разговоров. Сосредоточьтесь на важных делах.", advice: "Слушайте больше, чем говорите", color: "Жёлтый", number: "5, 14" },
            cancer: { name: "Рак", text: "Сегодня важно прислушиваться к своей интуиции. Эмоциональная чувствительность может быть обострена. Посвятите время семье и дому. Не принимайте поспешных решений — дайте себе время подумать.", advice: "Доверьтесь своим чувствам", color: "Серебристый", number: "2, 7" },
            leo: { name: "Лев", text: "Ваша харизма сегодня на высоте! Это идеальный день для самопрезентации и творчества. Не бойтесь быть в центре внимания. Возможны приятные комплименты и признание заслуг.", advice: "Сияйте, но не затмевайте других", color: "Золотой", number: "1, 4" },
            virgo: { name: "Дева", text: "День подходит для анализа и планирования. Ваша внимательность к деталям поможет избежать ошибок. Займитесь делами, требующими сосредоточенности. Вечером позвольте себе расслабиться.", advice: "Перфекционизм сегодня ваш союзник", color: "Бежевый", number: "3, 12" },
            libra: { name: "Весы", text: "Гармония и баланс — ключевые слова дня. Удачное время для переговоров и урегулирования конфликтов. Обратите внимание на эстетику и красоту вокруг. Возможны романтические встречи.", advice: "Ищите золотую середину", color: "Розовый", number: "6, 15" },
            scorpio: { name: "Скорпион", text: "Сегодня ваша проницательность будет особенно остра. День подходит для глубоких размышлений и трансформаций. Не бойтесь перемен — они приведут к росту. Будьте осторожны с финансами.", advice: "Доверяйте интуиции", color: "Тёмно-красный", number: "9, 18" },
            sagittarius: { name: "Стрелец", text: "Отличный день для путешествий и новых горизонтов. Ваш оптимизм заразителен. Расширяйте кругозор, изучайте что-то новое. Избегайте излишней поспешности в решениях.", advice: "Стремитесь к новым вершинам", color: "Фиолетовый", number: "3, 12" },
            capricorn: { name: "Козерог", text: "День благоприятен для карьерных вопросов и достижения целей. Ваша дисциплина приведёт к успеху. Уделите время долгосрочному планированию. Возможно получение важной информации.", advice: "Шаг за шагом к вершине", color: "Тёмно-синий", number: "8, 17" },
            aquarius: { name: "Водолей", text: "Сегодня ваша оригинальность будет в центре внимания. День подходит для нестандартных решений и экспериментов. Общайтесь с единомышленниками. Новые идеи могут принести успех.", advice: "Будьте собой, это ваша сила", color: "Голубой", number: "4, 13" },
            pisces: { name: "Рыбы", text: "День творчества и вдохновения. Ваша чувствительность поможет понять других. Займитесь искусством или медитацией. Избегайте иллюзий — смотрите на вещи реально. Возможны приятные сюрпризы.", advice: "Творите и мечтайте", color: "Морская волна", number: "7, 16" }
        };

        function updateDate() {
            const ud = document.getElementById('updateDate');
            if (ud) ud.innerHTML = `📅 Прогноз на ${new Date().toLocaleDateString('ru-RU', {day: 'numeric', month: 'long', year: 'numeric'})}`;
        }

        function showHoroscope(sign) {
            const data = horoscopes[sign];
            if (data && horoscopeResult) {
                const custom = JSON.parse(localStorage.getItem('astral_horoscope_' + sign));
                
                document.getElementById('selectedSign').innerHTML = `<i class="fas fa-star"></i> ${data.name}`;
                document.getElementById('horoscopeText').innerHTML = (custom && custom.text) ? custom.text : data.text;
                document.getElementById('adviceText').innerHTML = (custom && custom.advice) ? custom.advice : data.advice;
                document.getElementById('colorText').innerHTML = (custom && custom.color) ? custom.color : data.color;
                document.getElementById('numberText').innerHTML = (custom && custom.number) ? custom.number : data.number;

                const dateEl = document.getElementById('horoscopeDate');
                if (dateEl) {
                    if (custom && custom.dateStart && custom.dateEnd) {
                        const fmt = d => new Date(d + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
                        dateEl.textContent = `${fmt(custom.dateStart)} — ${fmt(custom.dateEnd)}`;
                        dateEl.style.display = 'block';
                    } else {
                        dateEl.style.display = 'none';
                    }
                }

                horoscopeResult.style.display = 'block';
                horoscopeResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }

        const cards = document.querySelectorAll('.zodiac-card');
        cards.forEach(card => {
            card.addEventListener('click', function() {
                const sign = this.getAttribute('data-sign');
                cards.forEach(c => c.classList.remove('selected'));
                this.classList.add('selected');
                showHoroscope(sign);
            });
        });

        updateDate();
    }

    // --- 6. Page-Specific: Index ---
    if (document.querySelector('.astrologySwiper')) {
        if (typeof Swiper !== 'undefined') {
            new Swiper('.astrologySwiper', {
                loop: true,
                autoplay: { delay: 4000, disableOnInteraction: false },
                pagination: { el: '.swiper-pagination', clickable: true },
                navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
                spaceBetween: 0,
                slidesPerView: 1,
                effect: 'slide',
                speed: 600,
            });
        }
    }

    const authBtnRoot = document.getElementById('authBtn');
    const menuAuthLink = document.getElementById('menuAuthLink');

    if (authBtnRoot || menuAuthLink) {
        const savedUser = localStorage.getItem('astral_current_user');
        if (savedUser) {
            if (authBtnRoot) {
                authBtnRoot.innerHTML = '<i class="fas fa-user-astronaut"></i>';
                authBtnRoot.href = 'profile.html';
            }
            if (menuAuthLink) {
                menuAuthLink.innerHTML = '<i class="fas fa-id-card"></i> Личный кабинет';
                menuAuthLink.href = 'profile.html';
            }
        } else {
            if (authBtnRoot) {
                authBtnRoot.innerHTML = '<i class="fas fa-user"></i>';
                authBtnRoot.href = 'login.html';
            }
            if (menuAuthLink) {
                menuAuthLink.innerHTML = '<i class="fas fa-sign-in-alt"></i> Авторизация';
                menuAuthLink.href = 'login.html';
            }
        }
    }

    // --- 7. Page-Specific: Login ---
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.onclick = () => {
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value.trim();
            const errorDiv = document.getElementById('loginError');
            if(errorDiv) errorDiv.innerHTML = '';
            
            if (!email || !password) {
                if(errorDiv) errorDiv.innerHTML = 'Заполните все поля';
                return;
            }
            
            const users = getUsers();
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                localStorage.setItem('astral_current_user', JSON.stringify(user));
                window.location.href = 'profile.html';
            } else {
                if(errorDiv) errorDiv.innerHTML = 'Неверный email или пароль';
            }
        };
        
        const loginPassword = document.getElementById('loginPassword');
        if (loginPassword) {
            loginPassword.onkeypress = (e) => {
                if (e.key === 'Enter') loginBtn.click();
            };
        }
    }

    // --- 8. Page-Specific: Profile ---
    const userBlock = document.getElementById('userBlock');
    if (userBlock) {
        const saved = localStorage.getItem('astral_current_user');
        if (saved) {
            const currentUserProf = JSON.parse(saved);
            userBlock.style.display = 'flex';
            
            const avatar = document.querySelector('.premium-avatar');
            if (avatar) {
                const zIcons = { 
                    aries: "♈&#xFE0E;", taurus: "♉&#xFE0E;", gemini: "♊&#xFE0E;", 
                    cancer: "♋&#xFE0E;", leo: "♌&#xFE0E;", virgo: "♍&#xFE0E;", 
                    libra: "♎&#xFE0E;", scorpio: "♏&#xFE0E;", sagittarius: "♐&#xFE0E;", 
                    capricorn: "♑&#xFE0E;", aquarius: "♒&#xFE0E;", pisces: "♓&#xFE0E;" 
                };
                avatar.innerHTML = currentUserProf.zodiac ? `<span>${zIcons[currentUserProf.zodiac] || '<i class="fas fa-moon"></i>'}</span>` : '<i class="fas fa-moon"></i>';
            }

            const pName = document.getElementById('profileName');
            const pEmail = document.getElementById('profileEmail');
            if(pName) pName.innerText = currentUserProf.name || 'Не указано';
            if(pEmail) pEmail.innerText = currentUserProf.email || 'Не указано';
            
            if (currentUserProf.registeredAt) {
                const date = new Date(currentUserProf.registeredAt);
                const pDate = document.getElementById('profileDate');
                if(pDate) pDate.innerText = date.toLocaleDateString('ru-RU');
            }
            
            const favs = currentUserProf.favorites || [];
            const container = document.getElementById('favoritesList');
            const favCount = document.getElementById('favCount');
            if (favCount) favCount.innerText = favs.length;
            
            if (container) {
                if (favs.length === 0) {
                    container.innerHTML = '<div class="empty-fav"><i class="fas fa-cloud-moon" style="font-size: 2rem; color: rgba(255,255,255,0.2); margin-bottom: 10px;"></i><p>У вас пока нет сохраненных пар.</p></div>';
                } else {
                    container.innerHTML = favs.map(item => `
                        <div class="favorite-item modern-fav-item">
                            <div class="modern-fav-icon"><i class="fas fa-star"></i></div>
                            <div class="modern-fav-content">
                                <div class="modern-fav-text">${item}</div>
                            </div>
                        </div>
                    `).join('');
                }
            }
        } else { window.location.href = 'login.html'; }
        
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.onclick = () => {
            if (confirm('Выйти из аккаунта?')) {
                localStorage.removeItem('astral_current_user');
                window.location.href = 'index.html';
            }
        };
    }

    // --- 9. Page-Specific: Register ---
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        function saveUser(user) {
            const users = getUsers();
            users.push(user);
            localStorage.setItem('astral_users', JSON.stringify(users));
        }

        registerBtn.onclick = () => {
            const name = document.getElementById('regName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value.trim();
            const zodiac = document.getElementById('regZodiac').value;
            const errorDiv = document.getElementById('registerError');
            const successDiv = document.getElementById('registerSuccess');

            if(errorDiv) errorDiv.innerHTML = '';
            if(successDiv) successDiv.innerHTML = '';

            if (!name || !email || !password || !zodiac) {
                if(errorDiv) errorDiv.innerHTML = 'Заполните все поля, включая знак зодиака';
                return;
            }
            if (!email.includes('@')) {
                if(errorDiv) errorDiv.innerHTML = 'Введите корректный email';
                return;
            }
            if (password.length < 4) {
                if(errorDiv) errorDiv.innerHTML = 'Пароль должен быть не менее 4 символов';
                return;
            }

            const users = getUsers();
            if (users.find(u => u.email === email)) {
                if(errorDiv) errorDiv.innerHTML = 'Этот email уже зарегистрирован';
                return;
            }

            const newUser = {
                name: name,
                email: email,
                password: password,
                zodiac: zodiac,
                registeredAt: new Date().toISOString(),
                favorites: []
            };
            
            saveUser(newUser);
            if(successDiv) successDiv.innerHTML = '✅ Регистрация успешна! Перенаправляем на страницу входа...';
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        };
        
        const regPassword = document.getElementById('regPassword');
        if (regPassword) {
            regPassword.onkeypress = (e) => {
                if (e.key === 'Enter') registerBtn.click();
            };
        }
    }

    // --- 10. Page-Specific: Destiny ---
    const calcDestinyBtn = document.getElementById('calcDestinyBtn');
    if (calcDestinyBtn) {
        calcDestinyBtn.onclick = () => {
            const name = document.getElementById('destName').value.trim();
            const date = document.getElementById('destDate').value;
            const moon = document.getElementById('destMoon').value;
            
            if (!name || !date || !moon) {
                alert('Пожалуйста, заполните необходимые данные для точного астрологического оттиска.');
                return;
            }

            const moonData = {
                'new': { title: 'Дитя Новолуния', text: 'Вы рождены в момент обнуления энергий. У вас есть редкий дар начинать с чистого листа, предвидеть тренды и быть первооткрывателем. Вам комфортно в тени до тех пор, пока вы не подготовите свой звездный час.', icon: 'fa-circle' },
                'waxing': { title: 'Энергия Роста', text: 'Рожденные на растущую луну наделены огромным созидательным потенциалом. Вы — строитель своей судьбы. Вам легко даются проекты, требующие упорства, веры и накопления ресурсов.', icon: 'fa-adjust' },
                'full': { title: 'Свет Полнолуния', text: 'Вы родились на пике активности ночного светила. Ваша аура притягательна и порой загадочна. Вас отличает высокая эмоциональность, обостренная интуиция и мощный уровень эмпатии.', icon: 'fa-circle' },
                'waning': { title: 'Мудрость Убывания', text: 'Ваша душа гораздо старше вашего физического возраста. Вы обладаете склонностью к самоанализу, эзотерике и глубокому осмыслению мира. Ваша сила — в умении отпускать.', icon: 'fa-moon' }
            };

            const paths = [
                'Мистический странник: Ваш путь лежит через изучение тайн и передачу знаний другим.',
                'Творец реальности: Ваша миссия — создавать гармонию через искусство и эстетику.',
                'Воин света: Вам суждено разрушать стереотипы и вести людей за собой к правде.',
                'Хранитель баланса: Ваша истинная сила — в умении находить компромиссы в бурях.'
            ];

            const gifts = [
                'Дар предчувствия событий за несколько мгновений до их наступления.',
                'Способность исцелять словом, успокаивая чужие тревоги и страхи.',
                'Интуитивное чтение истинных мотивов людей сквозь любые маски.',
                'Притяжение удачной череды случайностей везде, куда бы вы ни пошли.'
            ];

            // Deterministic selection based on inputs
            const numPath = name.length % paths.length;
            const numGift = (name.length + date.length) % gifts.length;
            
            const path = paths[numPath];
            const gift = gifts[numGift];
            const m = moonData[moon];

            const resArea = document.getElementById('destinyResultArea');
            if (resArea) {
                resArea.innerHTML = `
                    <div class="editorial-result" style="margin-top: 1.5rem; text-align: center;">
                        <div class="ed-res-names" style="margin-bottom: 1rem;">${name}</div>
                        <div class="ed-res-score" style="margin-bottom: 0;">
                            <span class="ed-res-pct" style="font-size: 1rem; letter-spacing: 3px; border-bottom: 1px solid #daa520; padding-bottom: 5px;">ЗВЁЗДНЫЙ ПАСПОРТ ОТКРЫТ</span>
                        </div>
                        
                        <div class="destiny-grid">
                            <div class="destiny-trait full-width">
                                <div class="destiny-trait-icon"><i class="fas ${m.icon}"></i></div>
                                <h5>${m.title}</h5>
                                <p>${m.text}</p>
                            </div>
                            <div class="destiny-trait">
                                <div class="destiny-trait-icon"><i class="fas fa-route"></i></div>
                                <h5>Кармический Путь</h5>
                                <p>${path}</p>
                            </div>
                            <div class="destiny-trait">
                                <div class="destiny-trait-icon"><i class="fas fa-gift"></i></div>
                                <h5>Высший Дар</h5>
                                <p>${gift}</p>
                            </div>
                        </div>
                    </div>
                `;
                
            }
        };
    }

    // --- 10. Page-Specific: Tarot tab filter ---
    const tarotTabs = document.querySelectorAll('.tarot-tab');
    if (tarotTabs.length > 0) {
        const tarotCategories = document.querySelectorAll('.tarot-category');
        tarotTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tarotTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const filter = tab.dataset.filter;
                tarotCategories.forEach(cat => {
                    cat.style.display = (filter === 'all' || cat.dataset.category === filter) ? 'block' : 'none';
                });
            });
        });
    }
});

// ========== 11. Card Detail Page Navigation ==========
if (document.querySelector('.page-card-detail')) {
    (function () {
        var params = new URLSearchParams(location.search);
        var cardParam = params.get('card');
        var knownIds = Array.from(document.querySelectorAll('.card-detail')).map(function (el) { return el.id; });
        var target = null;
        if (cardParam) {
            target = knownIds.includes(cardParam) ? cardParam : 'shut';
        } else if (!location.hash || !knownIds.includes(location.hash.slice(1))) {
            target = 'shut';
        }
        if (target) {
            location.replace(location.pathname + '#' + target);
        }
    })();
}
