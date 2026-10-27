
window.addEventListener("load", async () => {
    const FRAME_COUNT = 60;
    const header = document.querySelector("#header");
    const intro = document.querySelector("#intro");
    const sticky = document.querySelector(".intro-sticky");
    const stage = document.querySelector(".intro-stage");
    const laptop = document.querySelector("#laptop-image");
    const loader = document.querySelector("#page-loader");
    const mobile = matchMedia("(max-width: 1023px)");
    const groups = [...stage.querySelectorAll(".intro-text")];
    const titles = groups.map(group => group.querySelector(".intro-title"));
    const frames = [];
    let positions = [];
    let headerHeight = 0;
    let currentFrame = -1;
    let scheduled = false;

    // 값을 0~1 범위의 진행률로 변환
    const range = (value, start = 0, end = 1) =>
        Math.max(0, Math.min(1, (value - start) / (end - start)));

    // 진행률에 따른 시작값과 끝값 계산
    const mix = (start, end, progress) => start + (end - start) * progress;

    // CSS 변수 설정
    const set = (name, value) => stage.style.setProperty(name, value);

    // 화면 크기에 따른 요소 위치 계산
    function measure() {
        headerHeight = header.getBoundingClientRect().height;
        document.documentElement.style.setProperty("--header-height", `${headerHeight}px`);

        const width = stage.clientWidth;
        const padding = parseFloat(getComputedStyle(stage).paddingLeft);
        const text = mobile.matches ? titles : groups;
        const widths = text.map(element => element.getBoundingClientRect().width);
        const inset = mobile.matches
            ? Math.max(padding, width * 0.2)
            : padding;

        const edges = [inset, width - inset - widths[1]];

        positions = widths.map((textWidth, index) => ({
            start: mobile.matches ? edges[index] :
                Math.max(padding, Math.min(width * [0.27, 0.43][index], width - padding - textWidth)),
            end: mobile.matches ? (width - textWidth) / 2 : edges[index],
        }));

        if (!mobile.matches) {
            const gapStart = padding + widths[0];
            const gapEnd = edges[1];
            const gap = Math.max(0, gapEnd - gapStart - padding);

            // 노트북이 차지하는 약 53%의 폭을 기준으로 투명 여백을 보정
            set("--laptop-width", `${Math.min(1200, width * 0.8)}px`);
            set("--laptop-x", `${(gapStart + gapEnd) / 2}px`);
        }

        requestRender();
    }

    // 스크롤 진행률에 따른 애니메이션 계산
    function render() {
        scheduled = false;

        const distance = (intro.offsetHeight - sticky.offsetHeight) * 0.9;
        const progress = distance > 0
            ? range((headerHeight - intro.getBoundingClientRect().top) / distance)
            : 0;
        const movement = mobile.matches ? range(progress, 0.3, 1) : progress;

        positions.forEach(({ start, end }, index) => {
            set(index ? "--right-x" : "--left-x", `${mix(start, end, movement)}px`);
        });

        let offset = 100 * (1 - range(progress, 0, 0.5));

        if (mobile.matches) {
            offset = progress <= 0.3
                ? mix(100, 60, range(progress, 0, 0.3))
                : progress <= 0.5
                    ? mix(60, 30, range(progress, 0.3, 0.5))
                    : mix(30, 0, range(progress, 0.5, 1));
        }

        set("--laptop-offset", `${offset}dvh`);
        set("--description-opacity", range(progress, 0.75, 1));
        set("--scroll-opacity", 1 - range(progress, 0, 0.15));

        const index = Math.round(range(progress, 0.3, 1) * (FRAME_COUNT - 1));

        if (index !== currentFrame && frames[index]) {
            laptop.src = frames[index].src;
            currentFrame = index;
        }
    }

    // 다음 화면 갱신 시 애니메이션 실행
    function requestRender() {
        if (scheduled) return;

        scheduled = true;
        requestAnimationFrame(render);
    }

    // 노트북 이미지 60장 미리 로딩
    async function preload() {
        let next = 0;

        // 이미지를 나누어 비동기 로딩
        async function worker() {
            while (next < FRAME_COUNT) {
                const index = next++;
                const image = new Image();

                image.src = `./images/laptop/${String(index + 1).padStart(4, "0")}.png`;

                await image.decode();
                frames[index] = image;
            }
        }

        await Promise.all(Array.from({ length: 6 }, worker));
    }

    // 스크롤 및 화면 크기 변경 감지
    window.addEventListener("scroll", requestRender, { passive: true });
    window.addEventListener("resize", measure);
    new ResizeObserver(measure).observe(header);

    measure();

    try {
        // 이미지와 폰트 로딩 완료 대기
        await Promise.all([preload(), document.fonts.ready]);

        measure();
        render();

        // 스크롤 잠금 해제
        document.body.classList.remove("is-loading");
        window.dispatchEvent(new Event("resize"));

        // 로딩 화면 페이드아웃 후 제거
        if (loader) {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    loader.classList.add("is-hidden");

                    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

                    setTimeout(() => {
                        loader.remove();
                    }, reduceMotion ? 0 : 350);
                });
            });
        }

    } catch (error) {
        // 이미지 로딩 실패 시 오류 표시
        console.error("이미지 로딩 실패:", error);

        if (loader) {
            loader.classList.add("has-error");
            loader.querySelector(".loader-message").textContent =
                "이미지를 불러오지 못했습니다. 다시 시도해 주세요.";

            const retryButton = loader.querySelector(".loader-retry");
            retryButton.hidden = false;

            retryButton.addEventListener("click", () => {
                location.reload();
            });
        }
    }
});
