document.addEventListener("DOMContentLoaded", () => {

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
    ===================================================== */

    const languageButtons =
        document.querySelectorAll(
            ".language-button"
        );


    languageButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    languageButtons.forEach(
                        other =>
                            other.classList.remove(
                                "active"
                            )
                    );


                    button.classList.add(
                        "active"
                    );

                }
            );

        }
    );


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


    let currentYear = 2026;
    let currentMonth = 7;
    let selectedDate = 15;


    const eventData = {

        "2026-08-01": [
            {
                title: "초하루 법회",
                location: "전국 사찰",
                time: "10:00 시작"
            }
        ],

        "2026-08-07": [
            {
                title: "칠석 기도",
                location: "주요 사찰",
                time: "09:00 시작"
            }
        ],

        "2026-08-15": [
            {
                title: "백중 우란분절 법회",
                location: "전국 사찰",
                time: "10:00 시작"
            },
            {
                title: "백중 야외 법요식",
                location: "해인사 · 합천",
                time: "17:00 시작"
            }
        ],

        "2026-08-22": [
            {
                title: "주말 참선 프로그램",
                location: "지역 사찰",
                time: "14:00 시작"
            }
        ],

        "2026-08-29": [
            {
                title: "사찰 문화 체험 행사",
                location: "지역 사찰",
                time: "13:00 시작"
            }
        ],

        "2026-08-30": [
            {
                title: "일요 가족 법회",
                location: "전국 사찰",
                time: "10:30 시작"
            }
        ]

    };


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
            `${currentYear}년 ${currentMonth + 1}월`;


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
            `${currentYear}년 ${currentMonth + 1}월 ${selectedDate}일`;


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
                "등록된 불교 행사가 없습니다.";


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
                    "자세히 보기 →";


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


    renderCalendar();

    renderEventPanel();

});