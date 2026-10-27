
/* 기술 스택 데이터 */
const skills = [
    {
        category: "FRONT",
        icons: [
            { name: "HTML", icon: "html5/html5-original.svg" },
            { name: "CSS", icon: "css3/css3-original.svg" },
            { name: "JavaScript", icon: "javascript/javascript-original.svg" },
            { name: "Vue", icon: "vuejs/vuejs-original.svg" },
            { name: "Vite", icon: "vitejs/vitejs-original.svg" },
            { name: "Bootstrap", icon: "bootstrap/bootstrap-original.svg" }
        ]
    },
    {
        category: "BACK",
        icons: [
            { name: "Java", icon: "java/java-original-wordmark.svg" },
            { name: "Spring", icon: "spring/spring-original.svg" },
            { name: "Python", icon: "python/python-original.svg" },
            { name: "FastAPI", icon: "fastapi/fastapi-original.svg" },
            { name: "Node.js", icon: "nodejs/nodejs-original.svg" },
            { name: "MySQL", icon: "mysql/mysql-original.svg" }
        ]
    },
    {
        category: "OTHERS",
        icons: [
            { name: "Git", icon: "git/git-original.svg" },
            { name: "GitHub", icon: "github/github-original.svg" },
            { name: "VS Code", icon: "vscode/vscode-original.svg" },
            { name: "Notion", icon: "notion/notion-original.svg" },
            { name: "npm", icon: "npm/npm-original-wordmark.svg" },
            { name: "Docker", icon: "docker/docker-original.svg" }
        ]
    }
];

/* 스킬 카드 생성 */
const skillsList = document.querySelector("#skills .skills-list");
const skillTemplate = document.querySelector("#skill-template");

skills.forEach(skill => {
    const card = skillTemplate.content.firstElementChild.cloneNode(true);
    const list = card.querySelector(".skill-list");

    card.querySelector(".skill-category").textContent = skill.category;

    skill.icons.forEach(item => {
        const li = document.createElement("li");
        const img = document.createElement("img");

        img.src = `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${item.icon}`;
        img.alt = item.name;
        img.title = item.name;
        img.loading = "lazy";

        li.append(img);
        list.append(li);
    });

    skillsList.append(card);
});

/* 스크롤 등장 애니메이션 */
const skillCards = [...skillsList.querySelectorAll(".skill-card")];

const skillObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        entry.target.classList.toggle(
            "is-visible",
            entry.intersectionRatio >= 0.2
        );
    });
}, {
    threshold: 0.2
});

skillCards.forEach(card => skillObserver.observe(card));

/* SKILLS 메뉴 클릭 시 애니메이션 재실행 */
document.querySelectorAll('a[href="#skills"]').forEach(link => {
    link.addEventListener("click", () => {
        const visibleCards = skillCards.filter(card =>
            card.classList.contains("is-visible")
        );

        visibleCards.forEach(card => {
            card.style.transition = "none";
            card.classList.remove("is-visible");
        });

        // 변경된 스타일을 먼저 반영
        void skillsList.offsetWidth;

        visibleCards.forEach(card => {
            card.style.transition = "";
            card.classList.add("is-visible");
        });
    });
});
