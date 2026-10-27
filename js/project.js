
/* 프로젝트 데이터 */
const projects = [
    {
        name: "프로젝트 1",
        type: "개인 프로젝트",
        summary: "프로젝트 요약 설명",
        language: "HTML, CSS, JavaScript",
        image: "",
        site: "https://www.example.com",
        github: "https://www.example.com"
    },
    {
        name: "프로젝트 2",
        type: "팀 프로젝트",
        summary: "프로젝트 요약 설명",
        language: "Vue, Node.js, MySQL",
        image: "",
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

    // 대표 이미지
    const thumbnail = card.querySelector(".project-thumbnail");

    if (project.image) {
        const img = document.createElement("img");
        img.src = project.image;
        img.alt = `${project.name} 대표 이미지`;
        thumbnail.append(img);
    } else {
        thumbnail.textContent = "대표이미지";
    }

    // 프로젝트 링크
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
