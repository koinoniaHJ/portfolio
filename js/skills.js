const skillCards = [...document.querySelectorAll("#skills .skill-card")];

// 화면에서 벗어나면 숨기고, 다시 들어오면 표시
const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        entry.target.classList.toggle(
            "is-visible",
            entry.isIntersecting && entry.intersectionRatio >= 0.2
        );
    });
}, {
    threshold: 0.2,
});

skillCards.forEach((card) => skillObserver.observe(card));

// SKILLS 메뉴 클릭 시 이미 보이는 카드도 애니메이션 재실행
document.querySelectorAll('a[href="#skills"]').forEach((link) => {
    link.addEventListener("click", () => {
        const visibleCards = skillCards.filter((card) =>
            card.classList.contains("is-visible")
        );

        visibleCards.forEach((card) => {
            card.style.transition = "none";
            card.classList.remove("is-visible");
        });

        // 숨긴 상태를 반영한 후 애니메이션 재시작
        void document.querySelector("#skills").offsetWidth;

        visibleCards.forEach((card) => {
            card.style.transition = "";
            card.classList.add("is-visible");
        });
    });
});