window.addEventListener("load", async () => {
    const FRAME_COUNT = 60;
    const header = document.querySelector("#header");
    const intro = document.querySelector("#intro");
    const sticky = document.querySelector(".intro-sticky");
    const stage = document.querySelector(".intro-stage");
    const laptop = document.querySelector("#laptop-image");
    const mobile = matchMedia("(max-width: 699px)");
    const groups = [...stage.querySelectorAll(".intro-text")];
    const titles = groups.map(group => group.querySelector(".intro-title"));
    const frames = [];
    let positions = [];
    let headerHeight = 0;
    let currentFrame = -1;
    let scheduled = false;

    const range = (value, start = 0, end = 1) =>
        Math.max(0, Math.min(1, (value - start) / (end - start)));
    const mix = (start, end, progress) => start + (end - start) * progress;
    const set = (name, value) => stage.style.setProperty(name, value);

    function measure() {
        headerHeight = header.getBoundingClientRect().height;
        document.documentElement.style.setProperty("--header-height", `${headerHeight}px`);

        const width = stage.clientWidth;
        const padding = parseFloat(getComputedStyle(stage).paddingLeft);
        const text = mobile.matches ? titles : groups;
        const widths = text.map(element => element.getBoundingClientRect().width);
        const edges = [padding, width - padding - widths[1]];

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
            set("--laptop-width", `${Math.min(1000, width * 0.65, gap / 0.53)}px`);
            set("--laptop-x", `${(gapStart + gapEnd) / 2}px`);
        }
        requestRender();
    }

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

    function requestRender() {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(render);
    }

    async function preload() {
        let next = 0;
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

    window.addEventListener("scroll", requestRender, { passive: true });
    window.addEventListener("resize", measure);
    new ResizeObserver(measure).observe(header);
    measure();

    try {
        await Promise.all([preload(), document.fonts.ready]);
        measure();
        render();
        window.dispatchEvent(new Event("intro:ready"));
    } catch (error) {
        window.dispatchEvent(new CustomEvent("intro:error", { detail: error }));
    }
});