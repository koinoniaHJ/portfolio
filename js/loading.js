(() => {
    const loader = document.querySelector("#page-loader");
    if (!loader) {
        document.body.classList.remove("is-loading");
        return;
    }

    const message = loader.querySelector(".loader-message");
    const retryButton = loader.querySelector(".loader-retry");

    // 로더 실행 시점에 완료/실패 이벤트를 먼저 구독
    const introReady = new Promise((resolve, reject) => {
        window.addEventListener("intro:ready", resolve, { once: true });
        window.addEventListener("intro:error", (event) => reject(event.detail), { once: true });
    });

    function waitForPage() {
        if (document.readyState === "complete") return Promise.resolve();
        return new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
    }

    function nextFrame() {
        return new Promise((resolve) => requestAnimationFrame(resolve));
    }

    async function hideLoader() {
        document.body.classList.remove("is-loading");
        window.dispatchEvent(new Event("resize"));

        // 스크롤 잠금 해제와 레이아웃 변경이 화면에 반영된 다음 페이드아웃
        await nextFrame();
        await nextFrame();
        loader.classList.add("is-hidden");

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        setTimeout(() => loader.remove(), reduceMotion ? 0 : 350);
    }

    function showError(error) {
        console.error("페이지 로딩 실패:", error);
        loader.classList.add("has-error");
        message.textContent = "이미지를 불러오지 못했습니다. 다시 시도해 주세요.";
        retryButton.hidden = false;
    }

    retryButton.addEventListener("click", () => location.reload());

    const pageReady = waitForPage().then(() => document.fonts.ready);
    Promise.all([pageReady, introReady]).then(hideLoader).catch(showError);
})();