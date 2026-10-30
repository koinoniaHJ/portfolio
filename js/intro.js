
window.addEventListener("load", async () => {
    const FRAME_COUNT = 60;

    const header = document.querySelector("#header");
    const intro = document.querySelector("#intro");
    const sticky = document.querySelector(".intro-sticky");
    const stage = document.querySelector(".intro-stage");
    const text = document.querySelector(".intro-text");

    const left = document.querySelector(".intro-title-left");
    const right = document.querySelector(".intro-title-right");
    const descLeft = document.querySelector(".intro-description-left");
    const descRight = document.querySelector(".intro-description-right");
    const descriptions = document.querySelector(".intro-descriptions");

    const laptop = document.querySelector(".intro-laptop");
    const laptopImage = document.querySelector("#laptop-image");
    const scrollGuide = document.querySelector(".intro-scroll");
    const loader = document.querySelector("#page-loader");

    const frames = [];
    let currentFrame = -1;

    // 헤더 높이 계산
    function measureHeader() {
        document.documentElement.style.setProperty(
            "--header-height",
            `${header.offsetHeight}px`
        );
    }

    // 초기 타이포그래피 들여쓰기 계산
    function measureTitle() {
        const padding = parseFloat(getComputedStyle(stage).paddingLeft);
        const maxIndent = stage.clientWidth - padding * 2 - right.offsetWidth;

        const indent = Math.max(
            0,
            Math.min(left.querySelector("span").offsetWidth, maxIndent)
        );

        text.style.setProperty("--intro-indent", `${indent}px`);
    }

    // 노트북 이미지 60장 미리 로딩
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

    // 노트북 이미지 프레임 변경
    function showFrame(index) {
        if (index !== currentFrame) {
            laptopImage.src = frames[index].src;
            currentFrame = index;
        }
    }

    // 로딩 화면 제거
    function hideLoader() {
        document.body.classList.remove("is-loading");
        ScrollTrigger.refresh(true);

        if (!loader) return;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                loader.classList.add("is-hidden");

                const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

                setTimeout(() => {
                    loader.remove();
                }, reduced ? 0 : 350);
            });
        });
    }

    // 로딩 실패 처리
    function showError(error) {
        console.error("페이지 로딩 실패:", error);

        if (!loader) {
            document.body.classList.remove("is-loading");
            return;
        }

        loader.classList.add("has-error");
        loader.querySelector(".loader-message").textContent =
            "페이지를 불러오지 못했습니다. 다시 시도해 주세요.";

        const retryButton = loader.querySelector(".loader-retry");
        retryButton.hidden = false;
        retryButton.addEventListener("click", () => location.reload());
    }

    try {
        gsap.registerPlugin(ScrollTrigger);

        measureHeader();
        window.addEventListener("resize", measureHeader);

        // 이미지와 폰트 준비
        await Promise.all([preload(), document.fonts.ready]);

        measureTitle();
        showFrame(0);

        // PC 및 모바일 애니메이션 구분
        const media = gsap.matchMedia();

        media.add({
            desktop: "(min-width: 1024px)",
            mobile: "(max-width: 1023px)"
        }, context => {
            const isMobile = context.conditions.mobile;
            const playhead = { frame: 0 };

            // 화면 크기와 타이포그래피 위치 계산
            function bounds() {
                return {
                    width: stage.clientWidth,
                    padding: parseFloat(getComputedStyle(stage).paddingLeft),
                    baseX: (stage.clientWidth - text.offsetWidth) / 2,
                    baseY: (stage.clientHeight - text.offsetHeight) / 2
                };
            }

            // PC 설명문 위치 계산 (제목과 16px 간격)
            function placeDescriptions() {
                const b = bounds();

                gsap.set(descLeft, {
                    x: b.padding - b.baseX,
                    y: left.offsetTop + left.offsetHeight + 16
                });

                gsap.set(descRight, {
                    x: b.width - b.padding - descRight.offsetWidth - b.baseX,
                    y: right.offsetTop - descRight.offsetHeight - 16
                });
            }

            // 모바일 노트북·제목·설명문 세로 중앙 정렬
            function mobileLayout() {
                const gap = 16;

                const totalHeight =
                    laptop.offsetHeight +
                    text.offsetHeight +
                    descriptions.offsetHeight +
                    gap * 2;

                const top = Math.max(16, (stage.clientHeight - totalHeight) / 2);

                return {
                    laptopY: top - laptop.offsetTop,
                    textY: top + laptop.offsetHeight + gap - bounds().baseY
                };
            }

            measureTitle();

            if (!isMobile) {
                placeDescriptions();
            }

            // 스크롤 애니메이션 설정
            const timeline = gsap.timeline({
                defaults: {
                    ease: "none"
                },
                scrollTrigger: {
                    trigger: intro,
                    start: () => `top top+=${header.offsetHeight}`,
                    end: () => `+=${intro.offsetHeight - sticky.offsetHeight}`,
                    scrub: true,
                    invalidateOnRefresh: true,
                    onRefreshInit: () => {
                        measureTitle();

                        if (!isMobile) {
                            placeDescriptions();
                        }
                    }
                }
            });

            if (isMobile) {
                // 모바일: 타이포그래피를 중앙으로 이동
                timeline.to(text, {
                    y: () => mobileLayout().textY,
                    duration: 0.7
                }, 0.3);

                // 모바일: 첫 번째 제목 중앙 정렬
                timeline.to(left, {
                    x: () => (text.offsetWidth - left.offsetWidth) / 2 - left.offsetLeft,
                    duration: 0.7
                }, 0.3);

                // 모바일: 두 번째 제목 중앙 정렬
                timeline.to(right, {
                    x: () => (text.offsetWidth - right.offsetWidth) / 2 - right.offsetLeft,
                    duration: 0.7
                }, 0.3);

            } else {
                // PC: 첫 번째 제목 왼쪽으로 이동
                timeline.to(left, {
                    x: () => bounds().padding - bounds().baseX - left.offsetLeft,
                    duration: 1
                }, 0);

                // PC: 두 번째 제목 오른쪽으로 이동
                timeline.to(right, {
                    x: () => bounds().width - bounds().padding
                        - bounds().baseX - right.offsetLeft - right.offsetWidth,
                    duration: 1
                }, 0);
            }

            // 노트북 상승 및 모바일 중앙 배치
            timeline.fromTo(laptop,
                {
                    y: () => stage.clientHeight
                },
                {
                    y: () => isMobile ? mobileLayout().laptopY : 0,
                    duration: isMobile ? 1 : 0.5
                },
                0
            );

            // 스크롤 안내 숨기기
            timeline.to(scrollGuide, {
                opacity: 0,
                duration: 0.15
            }, 0);

            // 노트북 이미지 60장 전환
            timeline.to(playhead, {
                frame: FRAME_COUNT - 1,
                duration: 0.7,
                onUpdate: () => {
                    showFrame(Math.round(playhead.frame));
                }
            }, 0.3);

            // 마지막 구간에 설명문 표시
            timeline.to([descLeft, descRight], {
                opacity: 1,
                duration: 0.15
            }, 0.85);
        });

        hideLoader();

    } catch (error) {
        showError(error);
    }
});
