document.addEventListener("DOMContentLoaded", async () => {

    /* =====================================================
       회원가입 완료 알림
       UserController가 가입 성공 시 "/?signup=success"로 리다이렉트함.
       새로고침해도 다시 뜨지 않게 알림 후 쿼리스트링을 지운다.
    ===================================================== */

    const signupParams = new URLSearchParams(window.location.search);

    if (signupParams.get("signup") === "success") {
        alert("회원가입 완료!");

        signupParams.delete("signup");

        const remaining = signupParams.toString();

        window.history.replaceState(
            {},
            "",
            window.location.pathname + (remaining ? "?" + remaining : "")
        );
    }


    /* =====================================================
       HEADER + TOP BUTTON
    ===================================================== */

    const header = document.getElementById("siteHeader");
    const backToTop = document.getElementById("backToTop");

    function onScroll() {
        const scrollY = window.scrollY;

        header?.classList.toggle(
            "scrolled",
            scrollY > 20
        );

        backToTop?.classList.toggle(
            "show",
            scrollY > 500
        );
    }

    window.addEventListener(
        "scroll",
        onScroll,
        { passive: true }
    );

    onScroll();


    backToTop?.addEventListener(
        "click",
        () => {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );


    /* =====================================================
       LANGUAGE UI
       (active 클래스 토글이나 실제 번역 훅 연결은 common.js가 전부
       처리함 - 아래 window.onLanguageChange만 정의해두면 common.js가
       언어 버튼 클릭 시 알아서 불러줌. 달력/일정처럼 자바스크립트가
       나중에 새로 그려 넣는 부분까지 사전으로 정확히 번역하려고 이
       페이지는 공용 자동번역 대신 이 사전 방식을 씀 - home.i18n.js 참고)
    ===================================================== */

    let currentLang = "ko";

    const MONTH_NAMES_EN = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    function formatMonthTitle(year, month, lang) {
        if (lang === "en") return `${MONTH_NAMES_EN[month]} ${year}`;
        if (lang === "ja") return `${year}年${month + 1}月`;
        return `${year}년 ${month + 1}월`;
    }

    function formatEventDate(year, month, day, lang) {
        if (lang === "en") return `${MONTH_NAMES_EN[month]} ${day}, ${year}`;
        if (lang === "ja") return `${year}年${month + 1}月${day}日`;
        return `${year}년 ${month + 1}월 ${day}일`;
    }

    window.onLanguageChange = function (lang) {
        currentLang = HOME_TRANSLATIONS[lang] ? lang : "ko";

        // 프래그먼트(로그인/회원가입/드롭다운/로그아웃)는 이 페이지 전용 사전(HOME_TRANSLATIONS)이
        // 아니라 common.js의 공용 사전(I18N_MANUAL_OVERRIDES)에 있음 - 같이 적용해줌.
        if (window.applyManualOverrideTranslations) window.applyManualOverrideTranslations(currentLang);

        const t = HOME_TRANSLATIONS[currentLang];
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            if (t[key] !== undefined) el.textContent = t[key];
        });

        const ariaT = HOME_ARIA_TRANSLATIONS[currentLang];
        document.querySelectorAll("[data-i18n-aria]").forEach(el => {
            const key = el.getAttribute("data-i18n-aria");
            if (ariaT[key] !== undefined) el.setAttribute("aria-label", ariaT[key]);
        });

        // 달력/일정 패널은 데이터(날짜 표기, "자세히 보기" 등)까지 새로 그려야 반영됨
        renderCalendar();
        renderEventPanel();
    };


    /* =====================================================
       FEATURE HOVER INTERACTION
    ===================================================== */

    const featureSections =
        document.querySelectorAll(
            ".feature-section"
        );


    featureSections.forEach(
        section => {

            const typeItems =
                section.querySelectorAll(
                    ".type-item"
                );


            function deactivateAll() {

                typeItems.forEach(
                    item =>
                        item.classList.remove(
                            "is-active"
                        )
                );


                section.classList.remove(
                    "is-expanded",
                    "active-first",
                    "active-second"
                );

            }


            typeItems.forEach(
                (item, index) => {

                    const title =
                        item.querySelector(
                            "h2.type-title"
                        );


                    if (!title) {
                        return;
                    }


                    function activate() {

                        deactivateAll();


                        item.classList.add(
                            "is-active"
                        );


                        section.classList.add(
                            "is-expanded"
                        );


                        /*
                            첫 번째 제목이 열리면
                            아래 제목을 내려야 함
                        */

                        if (index === 0) {

                            section.classList.add(
                                "active-first"
                            );

                        } else {

                            section.classList.add(
                                "active-second"
                            );

                        }

                    }


                    title.addEventListener(
                        "mouseenter",
                        activate
                    );


                    /*
                        제목 → 서브메뉴로 마우스를
                        옮길 때 닫히면 안 되므로
                        item 전체에서 leave 처리
                    */

                    item.addEventListener(
                        "mouseleave",
                        () => {

                            /*
                                다음 프레임까지 기다려
                                sub-menu hover 전환 안정화
                            */

                            requestAnimationFrame(
                                () => {

                                    if (
                                        !item.matches(":hover")
                                    ) {

                                        deactivateAll();

                                    }

                                }
                            );

                        }
                    );


                    /*
                        키보드 / 클릭 접근
                    */

                    title.addEventListener(
                        "click",
                        () => {

                            const active =
                                item.classList.contains(
                                    "is-active"
                                );


                            if (active) {

                                deactivateAll();

                            } else {

                                activate();

                            }

                        }
                    );


                    title.addEventListener(
                        "keydown",
                        event => {

                            if (
                                event.key === "Enter" ||
                                event.key === " "
                            ) {

                                event.preventDefault();

                                title.click();

                            }

                        }
                    );

                }
            );

        }
    );


    /* =====================================================
       SCROLL FADE-IN
    ===================================================== */

    const fadeSections =
        document.querySelectorAll(
            ".fade-section"
        );


    if ("IntersectionObserver" in window) {

        const observer =
            new IntersectionObserver(

                entries => {

                    entries.forEach(
                        entry => {

                            if (
                                entry.isIntersecting
                            ) {

                                entry.target.classList.add(
                                    "visible"
                                );


                                observer.unobserve(
                                    entry.target
                                );

                            }

                        }
                    );

                },

                {
                    threshold: 0.04,
                    rootMargin:
                        "100px 0px -20px 0px"
                }
            );


        fadeSections.forEach(
            section => {

                const rect =
                    section.getBoundingClientRect();


                /*
                    알아보기 / 찾아보기 세트가
                    첫 스크롤부터 바로 보이도록
                */

                if (
                    rect.top <
                    window.innerHeight + 150
                ) {

                    section.classList.add(
                        "visible"
                    );

                } else {

                    observer.observe(
                        section
                    );

                }

            }
        );

    } else {

        fadeSections.forEach(
            section =>
                section.classList.add(
                    "visible"
                )
        );

    }


    /* =====================================================
       CALENDAR
    ===================================================== */

    const calendarGrid =
        document.getElementById(
            "calendarGrid"
        );

    const calendarMonthTitle =
        document.getElementById(
            "calendarMonthTitle"
        );

    const eventPanel =
        document.getElementById(
            "eventPanel"
        );

    const prevMonth =
        document.getElementById(
            "prevMonth"
        );

    const nextMonth =
        document.getElementById(
            "nextMonth"
        );


    if (
        !calendarGrid ||
        !calendarMonthTitle ||
        !eventPanel
    ) {
        return;
    }


    const today = new Date();
    let currentYear = today.getFullYear();
    let currentMonth = today.getMonth();
    let selectedDate = today.getDate();

    // 실제 등록된 템플스테이 프로그램(모집기간)과 불교 4대 명절로 채워짐 - loadCalendarEvents() 참고.
    // 아직 TEMPLE_EVENT(사찰 행사) 기능이 없어서, 그때까지는 이 두 소스로 대신 채움.
    const eventData = {};

    // 음력 기반이라 매년 날짜가 바뀜 - 부처님오신날은 법정공휴일이라 확인된 날짜지만,
    // 출가절/성도절/열반절은 정확한 변환을 못 구해서 일단 빼둠(잘못된 날짜 표시 방지).
    // 나중에 한국천문연구원 음양력변환 API 연동하면 매년 자동 계산 가능.
    const BUDDHIST_HOLIDAYS = {
        "2026-05-24": [{ title: "부처님오신날", location: "전국 사찰 (법정공휴일)", time: "" }]
    };

    // 사찰이 실제로 등록한 템플스테이 프로그램을 모집기간(openStartDate~openEndDate) 동안
    // 매일 달력에 표시함 - 사찰 필터 없이 전체를 그대로 가져옴.
    async function loadCalendarEvents() {
        Object.assign(eventData, BUDDHIST_HOLIDAYS);

        try {
            const res = await fetch("/templestayprograms");
            if (!res.ok) throw new Error("프로그램 목록 조회 실패: " + res.status);
            const programs = await res.json();

            programs.forEach(p => {
                if (!p.openStartDate || !p.openEndDate) return;

                const cursor = new Date(p.openStartDate);
                const end = new Date(p.openEndDate);

                while (cursor <= end) {
                    const key = makeKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
                    if (!eventData[key]) eventData[key] = [];
                    eventData[key].push({
                        title: p.title,
                        location: p.templeName || "",
                        time: `모집기간 ${p.openStartDate} ~ ${p.openEndDate}`,
                        description: p.description || "",
                        price: p.price,
                        duration: p.duration || "",
                        programId: p.programId
                    });
                    cursor.setDate(cursor.getDate() + 1);
                }
            });
        } catch (err) {
            console.warn("템플스테이 프로그램을 달력에 불러오지 못했습니다.", err);
        }
    }


    function pad(number) {

        return String(number)
            .padStart(2, "0");

    }


    function makeKey(
        year,
        month,
        day
    ) {

        return `${year}-${pad(month + 1)}-${pad(day)}`;

    }


    function renderCalendar() {

        calendarGrid.innerHTML = "";


        calendarMonthTitle.textContent =
            formatMonthTitle(currentYear, currentMonth, currentLang);


        const firstDay =
            new Date(
                currentYear,
                currentMonth,
                1
            ).getDay();


        const totalDays =
            new Date(
                currentYear,
                currentMonth + 1,
                0
            ).getDate();


        /*
            앞쪽 빈 셀
        */

        for (
            let i = 0;
            i < firstDay;
            i++
        ) {

            const empty =
                document.createElement(
                    "div"
                );


            empty.className =
                "calendar-day empty";


            calendarGrid.appendChild(
                empty
            );

        }


        /*
            실제 날짜
        */

        for (
            let day = 1;
            day <= totalDays;
            day++
        ) {

            const weekday =
                new Date(
                    currentYear,
                    currentMonth,
                    day
                ).getDay();


            const key =
                makeKey(
                    currentYear,
                    currentMonth,
                    day
                );


            const cell =
                document.createElement(
                    "button"
                );


            cell.type =
                "button";


            cell.className =
                "calendar-day";


            if (weekday === 0) {

                cell.classList.add(
                    "sunday"
                );

            }


            if (weekday === 6) {

                cell.classList.add(
                    "saturday"
                );

            }


            if (day === selectedDate) {

                cell.classList.add(
                    "selected"
                );

            }


            const number =
                document.createElement(
                    "span"
                );


            number.className =
                "day-number";


            number.textContent =
                day;


            cell.appendChild(
                number
            );


            if (
                eventData[key]?.length
            ) {

                const dot =
                    document.createElement(
                        "span"
                    );


                dot.className =
                    "day-event-dot";


                cell.appendChild(
                    dot
                );

            }


            cell.addEventListener(
                "click",
                () => {

                    selectedDate =
                        day;


                    renderCalendar();

                    renderEventPanel();

                }
            );


            calendarGrid.appendChild(
                cell
            );

        }


        /*
            뒤쪽 빈 셀도
            앞쪽과 완전히 같은 스타일
        */

        const used =
            firstDay + totalDays;


        const remaining =
            (7 - used % 7) % 7;


        for (
            let i = 0;
            i < remaining;
            i++
        ) {

            const empty =
                document.createElement(
                    "div"
                );


            empty.className =
                "calendar-day empty";


            calendarGrid.appendChild(
                empty
            );

        }

    }


    function renderEventPanel() {

        const key =
            makeKey(
                currentYear,
                currentMonth,
                selectedDate
            );


        const events =
            eventData[key] || [];


        eventPanel.innerHTML =
            "";


        const date =
            document.createElement(
                "div"
            );


        date.className =
            "event-date";


        date.textContent =
            formatEventDate(currentYear, currentMonth, selectedDate, currentLang);


        eventPanel.appendChild(
            date
        );


        if (
            events.length === 0
        ) {

            const noEvent =
                document.createElement(
                    "p"
                );


            noEvent.className =
                "no-event";


            noEvent.textContent =
                HOME_TRANSLATIONS[currentLang].noEventText;


            eventPanel.appendChild(
                noEvent
            );


            return;

        }


        events.forEach(
            event => {

                const item =
                    document.createElement(
                        "article"
                    );


                item.className =
                    "event-item";


                const title =
                    document.createElement(
                        "h3"
                    );


                title.className =
                    "event-title";


                title.textContent =
                    event.title;


                const location =
                    document.createElement(
                        "div"
                    );


                location.className =
                    "event-info";


                location.textContent =
                    `⌖ ${event.location}`;


                const time =
                    document.createElement(
                        "div"
                    );


                time.className =
                    "event-info";


                time.textContent =
                    `◷ ${event.time}`;


                const detail =
                    document.createElement(
                        "a"
                    );


                detail.href = "#";

                detail.className =
                    "event-detail";


                detail.textContent =
                    HOME_TRANSLATIONS[currentLang].eventDetailLabel;

                detail.addEventListener("click", (e) => {
                    e.preventDefault();
                    openEventModal(event);
                });

                item.append(
                    title,
                    location,
                    time,
                    detail
                );


                eventPanel.appendChild(
                    item
                );

            }
        );

    }

    // "자세히 보기" 클릭 시 일정 상세를 모달로 보여줌. 템플스테이 프로그램 일정이면
    // 참가비/체류기간과 예약 페이지 링크까지 같이 보여주고, 불교 명절처럼 프로그램과
    // 연결 안 된 일정이면 제목/장소만 보여줌.
    function openEventModal(event) {
        const t = HOME_TRANSLATIONS[currentLang];
        const rows = [];

        if (event.location) rows.push(`<p><strong>⌖</strong> ${escapeHtml(event.location)}</p>`);
        if (event.time) rows.push(`<p><strong>${t.modalPeriodLabel}</strong> ${escapeHtml(event.time)}</p>`);
        if (event.duration) rows.push(`<p><strong>${t.modalDurationLabel}</strong> ${escapeHtml(event.duration)}</p>`);
        if (typeof event.price === "number") rows.push(`<p><strong>${t.modalPriceLabel}</strong> ${event.price.toLocaleString()}${currentLang === "ko" ? "원" : currentLang === "ja" ? "円" : " KRW"}</p>`);
        if (event.description) rows.push(`<p style="white-space:pre-line;">${escapeHtml(event.description)}</p>`);

        Swal.fire({
            title: event.title,
            html: rows.join(""),
            confirmButtonText: event.programId ? t.modalGoReserve : t.modalClose,
            showCancelButton: !!event.programId,
            cancelButtonText: t.modalClose
        }).then((result) => {
            if (event.programId && result.isConfirmed) {
                location.href = "/reservation";
            }
        });
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }


    function changeMonth(amount) {

        currentMonth += amount;


        if (currentMonth < 0) {

            currentMonth = 11;
            currentYear--;

        }


        if (currentMonth > 11) {

            currentMonth = 0;
            currentYear++;

        }


        selectedDate = 1;


        renderCalendar();

        renderEventPanel();

    }


    prevMonth?.addEventListener(
        "click",
        () => changeMonth(-1)
    );


    nextMonth?.addEventListener(
        "click",
        () => changeMonth(1)
    );


    await loadCalendarEvents();

    renderCalendar();

    renderEventPanel();

});