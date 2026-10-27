
(() => {
    const loader = document.querySelector("#page-loader");

    if (!loader) {
        document.body.classList.remove("is-loading");
        return;
    }

    // 인트로 준비 완료
    window.addEventListener("intro:ready", () => {
        document.body.classList.remove("is-loading");
        window.dispatchEvent(new Event("resize"));

        requestAnimationFrame(() => {
            loader.classList.add("is-hidden");
            setTimeout(() => loader.remove(), 350);
        });
    }, { once: true });

    // 인트로 로딩 실패
    window.addEventListener("intro:error", event => {
        console.error("로딩 실패:", event.detail);

        loader.classList.add("has-error");
        loader.querySelector(".loader-message").textContent =
            "이미지를 불러오지 못했습니다. 다시 시도해 주세요.";

        const retryButton = loader.querySelector(".loader-retry");
        retryButton.hidden = false;
        retryButton.addEventListener("click", () => location.reload());
    }, { once: true });
})();