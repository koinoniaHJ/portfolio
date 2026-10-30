/* 프로젝트 데이터 */
const projects = [
    {
        name: "프로젝트 1",
        type: "개인 프로젝트",
        summary: "프로젝트 요약 설명",
        language: "HTML, CSS, JavaScript",
        images: [
            "./images/project1/01.webp",
            "./images/project1/02.webp",
            "./images/project1/03.webp"
        ],
        site: "https://www.example.com",
        github: "https://www.example.com"
    },
    {
        name: "프로젝트 2",
        type: "팀 프로젝트",
        summary: "프로젝트 요약 설명",
        language: "Vue, Node.js, MySQL",
        images: [],
        site: "",
        github: ""
    }
];

/* 프로젝트 카드 생성 */
const projectList = document.querySelector(".project-list");
const template = document.querySelector("#project-template");

projects.forEach(project => {
    const card = template.content.firstElementChild.cloneNode(true);

    card.querySelector(".project-name").textContent = project.name;
    card.querySelector(".project-type").textContent = project.type;
    card.querySelector(".project-summary").textContent = project.summary;
    card.querySelector(".project-language").textContent = project.language;

    /* 이미지 캐러셀 */
    const carousel = card.querySelector(".project-carousel");
    const track = card.querySelector(".project-carousel-track");
    const prevButton = card.querySelector(".project-carousel-prev");
    const nextButton = card.querySelector(".project-carousel-next");
    const dots = card.querySelector(".project-carousel-dots");
    const images = project.images || [];

    carousel.setAttribute("aria-label", `${project.name} 미리보기`);

    const slides = images.length ? images : [null];

    slides.forEach((src, index) => {
        const slide = document.createElement("div");
        slide.className = "project-slide";
        slide.setAttribute("role", "group");
        slide.setAttribute("aria-label", `${index + 1} / ${slides.length}`);

        if (src) {
            const img = document.createElement("img");
            img.src = src;
            img.alt = `${project.name} 미리보기 ${index + 1}`;
            img.loading = "lazy";
            img.decoding = "async";
            slide.append(img);
        } else {
            slide.textContent = "대표이미지";
        }

        track.append(slide);
    });

    if (images.length > 1) {
        let currentIndex = 0;

        const dotButtons = images.map((_, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.setAttribute("aria-label", `${index + 1}번 이미지 보기`);
            button.addEventListener("click", () => moveTo(index));
            dots.append(button);
            return button;
        });

        function moveTo(index) {
            currentIndex = (index + images.length) % images.length;

            track.style.transform = `translateX(-${currentIndex * 100}%)`;

            dotButtons.forEach((button, i) => {
                button.classList.toggle("is-active", i === currentIndex);
                button.setAttribute("aria-current", String(i === currentIndex));
            });

            [...track.children].forEach((slide, i) => {
                slide.setAttribute("aria-hidden", String(i !== currentIndex));
            });
        }

        prevButton.addEventListener("click", () => moveTo(currentIndex - 1));
        nextButton.addEventListener("click", () => moveTo(currentIndex + 1));

        moveTo(0);
    } else {
        prevButton.hidden = true;
        nextButton.hidden = true;
        dots.hidden = true;
    }

    /* 프로젝트 링크 */
    const site = card.querySelector(".project-site");
    const github = card.querySelector(".project-github");

    if (project.site) {
        site.href = project.site;
        site.querySelector("span").textContent = project.site;
    } else {
        site.remove();
    }

    if (project.github) {
        github.href = project.github;
        github.querySelector("span").textContent = project.github;
    } else {
        github.remove();
    }

    if (!project.site && !project.github) {
        card.querySelector(".project-links").remove();
    }

    projectList.append(card);
});

/* 스크롤 등장 애니메이션 */
const projectCards = [...projectList.querySelectorAll(".project-card")];

const projectObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        entry.target.classList.toggle(
            "is-visible",
            entry.intersectionRatio >= 0.2
        );
    });
}, {
    threshold: 0.2
});

projectCards.forEach(card => projectObserver.observe(card));