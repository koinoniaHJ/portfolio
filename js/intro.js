window.addEventListener("load", async () => {
    const SETTINGS = {
        frameCount: 60,
        imagePath: "./images/laptop/",
        concurrentLoads: 6,
        mobileBreakpoint: 600, // intro.css의 미디어 쿼리와 동일하게 유지
        animationEnd: 0.9,
        leftText: { start: 27, end: 5 },
        rightText: { start: 43, end: 65 },
    };

    const header = document.querySelector("#header");
    const intro = document.querySelector("#intro");
    const sticky = document.querySelector(".intro-sticky");
    const stage = document.querySelector(".intro-stage");
    const laptopImage = document.querySelector("#laptop-image");

    if (!header || !intro || !sticky || !stage || !laptopImage) return;

    const mobileQuery = window.matchMedia(`(max-width: ${SETTINGS.mobileBreakpoint}px)`);
    const frames = new Array(SETTINGS.frameCount);
    let headerHeight = 0;
    let currentFrame = -1;
    let updateRequested = false;

    // 진행률은 항상 0~1 사이를 유지
    function clamp(value) {
        return Math.min(1, Math.max(0, value));
    }

    function interpolate(start, end, progress) {
        return start + (end - start) * progress;
    }

    function getRangeProgress(progress, start, end) {
        return clamp((progress - start) / (end - start));
    }

    function updateHeaderHeight() {
        const height = header.getBoundingClientRect().height;
        if (headerHeight !== height) {
            headerHeight = height;
            document.documentElement.style.setProperty("--header-height", `${height}px`);
        }
        requestUpdate();
    }

    function getScrollProgress() {
        const scrollDistance = intro.offsetHeight - sticky.offsetHeight;
        const animationDistance = scrollDistance * SETTINGS.animationEnd;
        if (animationDistance <= 0) return 0;

        const scrolled = headerHeight - intro.getBoundingClientRect().top;
        return clamp(scrolled / animationDistance);
    }

    function updateDesktop(progress) {
        const left = interpolate(SETTINGS.leftText.start, SETTINGS.leftText.end, progress);
        const right = interpolate(SETTINGS.rightText.start, SETTINGS.rightText.end, progress);
        const laptopOffset = interpolate(100, 0, getRangeProgress(progress, 0, 0.5));

        stage.style.setProperty("--left-x", `${left}%`);
        stage.style.setProperty("--right-x", `${right}%`);
        stage.style.setProperty("--laptop-offset", `${laptopOffset}dvh`);
    }

    function updateMobile(progress) {
        // 30%부터 두 제목이 화면 가운데로 이동
        const titleProgress = getRangeProgress(progress, 0.3, 1);
        stage.style.setProperty("--title-progress", titleProgress);
        stage.style.setProperty("--title-x", `${50 * titleProgress}%`);

        // 노트북은 구간별로 다른 속도로 상승
        let laptopOffset;
        if (progress <= 0.3) {
            laptopOffset = interpolate(100, 60, getRangeProgress(progress, 0, 0.3));
        } else if (progress <= 0.5) {
            laptopOffset = interpolate(60, 30, getRangeProgress(progress, 0.3, 0.5));
        } else {
            laptopOffset = interpolate(30, 0, getRangeProgress(progress, 0.5, 1));
        }
        stage.style.setProperty("--laptop-offset", `${laptopOffset}dvh`);
    }

    function updateLaptopFrame(progress) {
        const rotation = getRangeProgress(progress, 0.3, 1);
        const frameIndex = Math.round(rotation * (SETTINGS.frameCount - 1));
        if (frameIndex === currentFrame || !frames[frameIndex]) return;

        laptopImage.src = frames[frameIndex].src;
        currentFrame = frameIndex;
    }

    function render() {
        updateRequested = false;
        const progress = getScrollProgress();

        if (mobileQuery.matches) {
            updateMobile(progress);
        } else {
            updateDesktop(progress);
        }

        stage.style.setProperty("--description-opacity", getRangeProgress(progress, 0.75, 1));
        stage.style.setProperty("--scroll-opacity", 1 - getRangeProgress(progress, 0, 0.15));
        updateLaptopFrame(progress);
    }

    function requestUpdate() {
        if (updateRequested) return;
        updateRequested = true;
        window.requestAnimationFrame(render);
    }

    async function preloadFrames() {
        let nextIndex = 0;

        async function loadFrames() {
            while (nextIndex < SETTINGS.frameCount) {
                const index = nextIndex++;
                const fileName = `${String(index + 1).padStart(4, "0")}.png`;
                const image = new Image();
                image.src = `${SETTINGS.imagePath}${fileName}`;

                try {
                    await image.decode();
                    frames[index] = image;
                } catch (error) {
                    throw new Error(`이미지 로딩 실패: ${fileName}`, { cause: error });
                }
            }
        }

        const count = Math.min(SETTINGS.concurrentLoads, SETTINGS.frameCount);
        await Promise.all(Array.from({ length: count }, () => loadFrames()));
    }

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", updateHeaderHeight);
    const headerObserver = new ResizeObserver(updateHeaderHeight);
    headerObserver.observe(header);
    updateHeaderHeight();

    try {
        await preloadFrames();
        render(); // 로더가 사라지기 전에 현재 스크롤 위치 반영
        window.dispatchEvent(new Event("intro:ready"));
    } catch (error) {
        window.dispatchEvent(new CustomEvent("intro:error", { detail: error }));
    }
});