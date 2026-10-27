const contactForm = document.querySelector("#contact-form");
const contactStatus = document.querySelector(".contact-status");

contactForm.addEventListener("submit", async event => {
    event.preventDefault();

    const button = contactForm.querySelector('button[type="submit"]');

    button.disabled = true;
    button.textContent = "전송 중...";
    contactStatus.hidden = true;

    try {
        const response = await fetch(contactForm.action, {
            method: "POST",
            body: new URLSearchParams(new FormData(contactForm))
        });

        const result = (await response.text()).trim();

        if (!response.ok || result !== "OK") {
            throw new Error("전송 실패");
        }

        contactStatus.textContent = "메시지가 전송되었습니다.";
        contactStatus.hidden = false;
        contactForm.reset();

    } catch (error) {
        console.error(error);
        contactStatus.textContent = "전송 결과를 확인하지 못했습니다.";
        contactStatus.hidden = false;

    } finally {
        button.disabled = false;
        button.textContent = "메시지 보내기";
    }
});