// Odometer roll-up and the guestbook copy button. Everything else is HTML and CSS.

(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const odometer = document.querySelector(".odometer");
  if (odometer && !reduce && "IntersectionObserver" in window) {
    const digits = [...odometer.querySelectorAll("span:not(.plus)")];
    const target = Number(odometer.dataset.target);
    const render = (n) => {
      String(n).padStart(digits.length, "0").split("").forEach((d, i) => {
        digits[i].textContent = d;
      });
    };
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const duration = 1400;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        render(Math.round(target * (1 - Math.pow(1 - t, 3))));
        if (t < 1) requestAnimationFrame(tick);
      };
      render(0);
      requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    observer.observe(odometer);
  }

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        button.textContent = "Copied!";
      } catch {
        button.textContent = "Copy failed, select it instead";
      }
      setTimeout(() => { button.textContent = "Copy"; }, 2000);
    });
  });
})();

// The guestbook is an email: turn the form into a prefilled message.
(() => {
  const form = document.getElementById("gb-form");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = form.elements.name.value.trim();
    const message = form.elements.message.value.trim();
    const subject = `Signed your guestbook: ${name}`;
    const body = `${message}\n\n${name}`;
    window.location.href = `mailto:cto@treatoapp.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
})();
