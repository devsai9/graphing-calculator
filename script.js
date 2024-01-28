import * as gr from './graph.js';
import {tokenize, parse, evaluate, makeFunc} from './parser.js';
const head = "graph> ";
const shell = document.querySelector("#shell");
const graph = document.querySelector("#graph");
let line = 0;
const lines = [head];

function render() {
    shell.value = "";
    for(let i = 0; i < lines.length; i++) {
        if(i !== 0) shell.value += "\n";
        shell.value += lines[i];
    }
}

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
    // console.log(shell.value.slice(line));
    // if (!shell.value.slice(line).startsWith(head)) {
    //     const index = head.length + line;
    //     shell.value = shell.value.slice(0, line) + head + shell.value.slice(index - 1);
    //     shell.selectionStart = index;
    //     shell.selectionEnd = index;
    // }
    //lines[lines.length - 1] = shell.value.slice(line);
});

const handleCommand = (e) => {
    const command = lines[lines.length - 1].slice(head.length);
    const space = command.indexOf(" ");
    const func = command.slice(0, space);
    const arg = command.slice(space + 1);

    // console.log("com:", command);

    switch (func) {
        case 'draw': 
            graph.style.display = "inline-block";
            shell.style.display = "none";
            gr.draw(makeFunc(parse(tokenize(arg))), true);
            break;
        case 'calc':
            const res = evaluate(parse(tokenize(arg)));
            lines[lines.length - 1] += res;
            line = shell.value.length;
            break;
    }
    render();
};

shell.addEventListener('keydown', (e) => {
    if(e.key === 'ArrowLeft') {
        if(shell.selectionStart < head.length + line + 1) {
            shell.selectionStart = head.length + line + 1
            shell.selectionEnd = head.length + line + 1
        }
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
    else if(e.key === 'Enter') {
        lines[lines.length - 1] += "\n";
        handleCommand(e);
        lines.push(head + "");
    }
    else if(e.key === 'Backspace') {
        if(lines[lines.length - 1].length >= head.length) lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1);
        else e.preventDefault();
    }
    else if(e.key.length === 1){
        e.preventDefault();
        lines[lines.length - 1] += e.key;
        render();
        // console.log(lines)
    }
    render();
})

document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') {
        graph.style.display = "none";
        shell.style.display = "inline-block";
    }
});