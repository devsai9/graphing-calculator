const shell = document.querySelector("#shell");

document.body.addEventListener("mousedown", (e) => {
    e.preventDefault();
});

shell.addEventListener("mousedown", () => {
    shell.focus();
});

window.addEventListener("resize", () => {
    if(window.innerWidth > 690) shell.focus();
})