document.addEventListener("DOMContentLoaded", function () {


    /* =====================================================
       HEADER
    ===================================================== */

    const header =
        document.getElementById("siteHeader");


    function updateHeader() {

        if (window.scrollY > 20) {

            header.classList.add("scrolled");

        } else {

            header.classList.remove("scrolled");

        }

    }


    window.addEventListener(
        "scroll",
        updateHeader
    );


    updateHeader();



    /* =====================================================
       LANGUAGE BUTTON
    ===================================================== */

    const languageButtons =
        document.querySelectorAll(
            ".language-button"
        );


    languageButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    languageButtons.forEach(
                        function (other) {

                            other.classList.remove(
                                "active"
                            );

                        }
                    );


                    button.classList.add(
                        "active"
                    );

                }
            );

        }
    );



    /* =====================================================
       FEATURE SUB MENU
    ===================================================== */

    const typeItems =
        document.querySelectorAll(
            ".type-item"
        );


    typeItems.forEach(
        function (item) {

            const title =
                item.querySelector(
                    ".type-title"
                );


            title.addEventListener(
                "click",
                function () {


                    const isOpen =
                        item.classList.contains(
                            "open"
                        );


                    typeItems.forEach(
                        function (other) {

                            other.classList.remove(
                                "open"
                            );

                        }
                    );


                    if (!isOpen) {

                        item.classList.add(
                            "open"
                        );

                    }

                }
            );


            title.addEventListener(
                "keydown",
                function (event) {

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



    /* =====================================================
       FADE IN
    ===================================================== */

    const fadeSections =
        document.querySelectorAll(
            ".fade-section"
        );


    const observer =
        new IntersectionObserver(

            function (entries) {

                entries.forEach(
                    function (entry) {

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

                threshold: 0.05,

                rootMargin:
                    "100px 0px -30px 0px"

            }

        );


    fadeSections.forEach(
        function (section) {

            const rect =
                section.getBoundingClientRect();


            /*
               처음 스크롤할 때
               알아보기/찾아보기가
               너무 늦게 뜨는 문제 방지
            */

            if (
                rect.top <
                window.innerHeight + 120
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



    /* =====================================================
       BACK TO TOP
    ===================================================== */

    const backToTop =
        document.getElementById(
            "backToTop"
        );


    function updateTopButton() {

        if (
            window.scrollY > 500
        ) {

            backToTop.classList.add(
                "show"
            );

        } else {

            backToTop.classList.remove(
                "show"
            );

        }

    }


    window.addEventListener(
        "scroll",
        updateTopButton
    );


    updateTopButton();


    backToTop.addEventListener(
        "click",
        function () {

            window.scrollTo({

                top: 0,

                behavior: "smooth"

            });

        }
    );



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


    const previousButton =
        document.getElementById(
            "prevMonth"
        );


    const nextButton =
        document.getElementById(
            "nextMonth"
        );



    let currentYear = 2026;

    /*
       JavaScript month
       0 = 1월
       7 = 8월
    */

    let currentMonth = 7;

    let selectedDate = 15;



    /* =====================================================
       TEMP EVENT DATA
    ===================================================== */

    const eventData = {


        "2026-08-01": [

            {

                title:
                    "조계사 정기 법회",

                location:
                    "조계사 · 서울",

                time:
                    "10:00 시작"

            }

        ],


        "2026-08-07": [

            {

                title:
                    "선 명상 입문 워크숍",

                location:
                    "서울",

                time:
                    "14:00 시작"

            }

        ],


        "2026-08-15": [

            {

                title:
                    "백중 우란분절 법회",

                location:
                    "전국 사찰",

                time:
                    "10:00 시작"

            },


            {

                title:
                    "백중 야외 법요식",

                location:
                    "해인사 · 합천",

                time:
                    "17:00 시작"

            }

        ],


        "2026-08-22": [

            {

                title:
                    "야간 반야심경 법회",

                location:
                    "지역 사찰",

                time:
                    "19:00 시작"

            }

        ],


        "2026-08-28": [

            {

                title:
                    "사찰 음식 체험",

                location:
                    "서울",

                time:
                    "13:00 시작"

            }

        ],


        "2026-08-30": [

            {

                title:
                    "불교 문화 행사",

                location:
                    "지역 사찰",

                time:
                    "11:00 시작"

            }

        ]

    };



    function pad(number) {

        return String(number)
            .padStart(
                2,
                "0"
            );

    }



    function createDateKey(
        year,
        month,
        date
    ) {

        return (
            year +
            "-" +
            pad(month + 1) +
            "-" +
            pad(date)
        );

    }



    function renderCalendar() {


        calendarGrid.innerHTML =
            "";


        calendarMonthTitle.textContent =
            currentYear +
            "년 " +
            (currentMonth + 1) +
            "월";


        const firstDay =
            new Date(
                currentYear,
                currentMonth,
                1
            ).getDay();


        const daysInMonth =
            new Date(
                currentYear,
                currentMonth + 1,
                0
            ).getDate();



        /*
           이전 달 영역
           빈칸으로 통일
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



        for (
            let day = 1;
            day <= daysInMonth;
            day++
        ) {


            const date =
                new Date(
                    currentYear,
                    currentMonth,
                    day
                );


            const weekday =
                date.getDay();


            const key =
                createDateKey(
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


            if (
                weekday === 0
            ) {

                cell.classList.add(
                    "sunday"
                );

            }


            if (
                weekday === 6
            ) {

                cell.classList.add(
                    "saturday"
                );

            }


            if (
                day === selectedDate
            ) {

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



            /*
               행사 존재 표시
            */

            if (
                eventData[key]
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
                function () {

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
           마지막 빈 칸도
           앞쪽 빈칸과 동일하게
        */

        const usedCells =
            firstDay +
            daysInMonth;


        const remainder =
            usedCells % 7;


        if (
            remainder !== 0
        ) {

            const emptyCount =
                7 -
                remainder;


            for (
                let i = 0;
                i < emptyCount;
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

    }



    function renderEventPanel() {


        const key =
            createDateKey(
                currentYear,
                currentMonth,
                selectedDate
            );


        const events =
            eventData[key] || [];


        eventPanel.innerHTML =
            "";



        const dateText =
            document.createElement(
                "div"
            );


        dateText.className =
            "event-date";


        dateText.textContent =
            currentYear +
            "년 " +
            (currentMonth + 1) +
            "월 " +
            selectedDate +
            "일";


        eventPanel.appendChild(
            dateText
        );



        if (
            events.length === 0
        ) {

            const empty =
                document.createElement(
                    "p"
                );


            empty.className =
                "no-event";


            empty.textContent =
                "등록된 불교 행사가 없습니다.";


            eventPanel.appendChild(
                empty
            );


            return;

        }



        events.forEach(
            function (event) {


                const article =
                    document.createElement(
                        "article"
                    );


                article.className =
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
                    "⌖ " +
                    event.location;



                const time =
                    document.createElement(
                        "div"
                    );


                time.className =
                    "event-info";


                time.textContent =
                    "◷ " +
                    event.time;



                const detail =
                    document.createElement(
                        "a"
                    );


                detail.className =
                    "event-detail";


                detail.href =
                    "#";


                detail.textContent =
                    "자세히 보기 →";



                article.appendChild(
                    title
                );


                article.appendChild(
                    location
                );


                article.appendChild(
                    time
                );


                article.appendChild(
                    detail
                );


                eventPanel.appendChild(
                    article
                );

            }
        );

    }



    function changeMonth(
        amount
    ) {


        currentMonth +=
            amount;


        if (
            currentMonth < 0
        ) {

            currentMonth =
                11;


            currentYear--;

        }


        if (
            currentMonth > 11
        ) {

            currentMonth =
                0;


            currentYear++;

        }


        selectedDate =
            1;


        renderCalendar();


        renderEventPanel();

    }



    previousButton.addEventListener(
        "click",
        function () {

            changeMonth(-1);

        }
    );


    nextButton.addEventListener(
        "click",
        function () {

            changeMonth(1);

        }
    );



    renderCalendar();

    renderEventPanel();

});