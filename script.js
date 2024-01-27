const head = "graph> ";
const shell = document.querySelector("#shell");
let line = 0;

document.body.addEventListener("mousedown", (e) => {
    e.preventDefault();
});

shell.addEventListener("mousedown", () => {
    shell.focus();
});

window.addEventListener("resize", () => {
    if(window.innerWidth > 690) shell.focus();
})

shell.value = head;

shell.addEventListener('input', () => {
    console.log(shell.value.slice(line));
    if (!shell.value.slice(line).startsWith(head)) {
        const index = head.length + line;
        shell.value = shell.value.slice(0, line) + head + shell.value.slice(index - 1);
        shell.selectionStart = index;
        shell.selectionEnd = index;
    }
});

const handleCommand = (e) => {
    line = shell.selectionStart + 1;
    console.log(line);
    shell.value += "\n" + head;
    e.preventDefault();
};

shell.addEventListener('keydown', (e) => {
    if(e.key === 'ArrowLeft') {
        if(e.ctrlKey) shell.selectionStart = line + 1;
        if(shell.selectionStart < head.length + line + 1) shell.selectionStart = head.length + line + 1;
    }
    else if(e.key === 'ArrowUp') {
        const index = head.length + line;
        shell.selectionStart = index;
        if(!e.ctrlKey) shell.selectionEnd = index;
        e.preventDefault();
    }
    else if(e.key === 'ArrowDown') {
        const index = shell.value.length;
        if(!e.ctrlKey) shell.selectionStart = index;
        shell.selectionEnd = index;
        e.preventDefault();
    }
    else if(e.key === 'a' && e.ctrlKey) {
        e.preventDefault();
    }
    else if(e.key === 'Enter') handleCommand(e);
})

