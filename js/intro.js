
window.addEventListener("load", async () => {
    const FRAME_COUNT = 60;
    const MOBILE_FRAME_STEP = 2;
    const KEY_FRAMES = [0, 10, 20, 30, 40, 50, 59];

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

    const mobileQuery = matchMedia("(max-width: 1023px)");

    const frames = new Array(FRAME_COUNT);
    const pending = new Map();

    let currentFrame = -1;
    let requestedFrame = 0;

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

    // PC 및 모바일 프레임 번호 계산
    function frameNumber(index) {
        const frame = Math.max(
            0,
            Math.min(FRAME_COUNT - 1, Math.round(index))
        );

        if (!mobileQuery.matches) return frame;
        if (frame === FRAME_COUNT - 1) return frame;

        return Math.min(
            FRAME_COUNT - 1,
            Math.round(frame / MOBILE_FRAME_STEP) * MOBILE_FRAME_STEP
        );
    }

    // 노트북 이미지 표시
    function renderFrame(index) {
        if (!frames[index] || currentFrame === index) return;

        laptopImage.src = frames[index].src;
        currentFrame = index;
    }

    // 노트북 이미지 개별 로딩
    function loadFrame(index) {
        if (frames[index]) {
            return Promise.resolve(frames[index]);
        }

        if (pending.has(index)) {
            return pending.get(index);
        }

        const image = new Image();
        image.decoding = "async";
        image.src = `./images/laptop/${String(index + 1).padStart(4, "0")}.png`;

        const promise = image.decode().then(() => {
            frames[index] = image;

            // 현재 스크롤 위치에 필요한 프레임이면 바로 표시
            if (requestedFrame === index) {
                renderFrame(index);
            }

            return image;
        }).finally(() => {
            pending.delete(index);
        });

        pending.set(index, promise);

        return promise;
    }

    // 주요 프레임 먼저 로딩
    async function preloadKeyFrames() {
        const indices = KEY_FRAMES.filter(index => !frames[index]);
        let next = 0;

        async function worker() {
            while (next < indices.length) {
                const index = indices[next++];

                try {
                    await loadFrame(index);
                } catch (error) {
                    console.warn(`주요 프레임 ${index + 1} 로딩 실패`, error);
                }
            }
        }

        await Promise.all(
            Array.from({ length: 3 }, worker)
        );
    }

    // 나머지 이미지 점진적 로딩
    async function preloadRemaining() {
        const indices = [];

        for (let i = 1; i < FRAME_COUNT; i++) {
            if (frameNumber(i) === i && !frames[i]) {
                indices.push(i);
            }
        }

        let next = 0;
        const concurrency = mobileQuery.matches ? 2 : 4;

        async function worker() {
            while (next < indices.length) {
                const index = indices[next++];

                try {
                    await loadFrame(index);
                } catch (error) {
                    console.warn(`프레임 ${index + 1} 로딩 실패`, error);
                }
            }
        }

        await Promise.all(
            Array.from({ length: concurrency }, worker)
        );
    }

    // 현재 위치에서 가장 가까운 준비된 프레임 찾기
    function nearestFrame(index) {
        let nearest = -1;

        for (let i = 0; i < FRAME_COUNT; i++) {
            if (!frames[i]) continue;

            if (
                nearest === -1 ||
                Math.abs(i - index) < Math.abs(nearest - index)
            ) {
                nearest = i;
            }
        }

        return nearest;
    }

    // 노트북 이미지 프레임 변경
    function showFrame(index) {
        const target = frameNumber(index);
        requestedFrame = target;

        if (frames[target]) {
            renderFrame(target);
            return;
        }

        // 아직 로딩되지 않았다면 가까운 프레임 표시
        const nearest = nearestFrame(target);

        if (nearest !== -1) {
            renderFrame(nearest);
        }

        // 필요한 프레임을 우선 요청
        if (!pending.has(target)) {
            loadFrame(target).catch(error => {
                console.warn(`프레임 ${target + 1} 로딩 실패`, error);
            });
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

        // 첫 번째 이미지와 폰트 준비
        await Promise.all([
            laptopImage.decode(),
            document.fonts.ready
        ]);

        // HTML의 첫 번째 이미지를 재사용
        frames[0] = {
            src: laptopImage.currentSrc || laptopImage.src
        };

        currentFrame = 0;

        // 회전 애니메이션의 주요 프레임 준비
        await preloadKeyFrames();

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

                const top = Math.max(
                    16,
                    (stage.clientHeight - totalHeight) / 2
                );

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

            // 노트북 이미지 프레임 전환
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

        // 주요 프레임 준비 후 로딩 화면 종료
        hideLoader();

        // 나머지 이미지는 백그라운드에서 로딩
        setTimeout(() => {
            preloadRemaining().catch(console.error);
        }, 100);

    } catch (error) {
        showError(error);
    }
});
