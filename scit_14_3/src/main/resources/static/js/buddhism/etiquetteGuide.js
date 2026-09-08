/* 예절 가이드 아코디언 - 마크업이 etiquetteGuide.html에 이미 고정돼있어서(정적 전환),
   여기서는 클릭 시 .item-reason을 펼치고/접는 토글만 담당한다. */
function enhance() {
    document.querySelectorAll(".item-action:not(.no-reason)").forEach((btn) => {
        const reasonWrap = btn.nextElementSibling;
        if (!reasonWrap) return;
        btn.addEventListener("click", () => {
            const isOpen = reasonWrap.classList.toggle("open");
            btn.setAttribute("aria-expanded", String(isOpen));
        });
    });
}

document.addEventListener("DOMContentLoaded", enhance);
