import * as gr from './graph.js';
import {tokenize, parse, evaluate, makeFunc} from './parser.js';
const head = "graph> ";
const shell = document.querySelector("#shell");
const graph = document.querySelector("#graph");
//let line = 0;
let caret = head.length;
let lines = [{
    start: 0,
    wall: head.length,
    text: head
}];

function render() {
    shell.value = "";
    for(let i = 0; i < lines.length; i++) {
        if(i !== 0) shell.value += "\n";
        shell.value += lines[i].text;
    }
    setCaret();
}

function setCaret() {
    shell.setSelectionRange(caret, caret);
}

function setSelect(start, end) {
    shell.selectionStart = start;
    shell.selectionEnd = end;
}

function getLine(offset=0) {
    return lines[lines.length - offset - 1];
}

function print(str) {
    if(lines.length === 0) {
        lines.push({
            start: 0,
            wall: wall,
            text: str
        });
        caret += str.length + 1;
    }
    else {
        getLine().text += str;
        caret += str.length;
    }
}

function println(str, wall=0) {
    if(lines.length === 0) {
        lines.push({
            start: 0,
            wall: wall,
            text: str
        });
        caret = wall;
        return;
    }
    const prev = getLine();
    lines.push({
        start: prev.start + prev.text.length + 1,
        wall: wall,
        text: str
    });
    caret = wall + getLine().start;
}

function insert(str) {
    const line = getLine().text;
    const pos = caret - getLine().start;
    getLine().text = line.slice(0, pos) + str + line.slice(pos);
    caret += str.length;
}

function remove() {
    const line = getLine();
    if(caret <= line.wall + line.start) return;
    line.text = line.text.slice(0, caret - line.start - 1) + line.text.slice(caret - line.start);
    caret--;
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

const handleCommand = () => {
    const command = getLine().text.slice(head.length).trim().replace(/\s+/g, ' ');
    const space = command.indexOf(" ");
    const func = space > -1 ? command.slice(0, space).toLowerCase() : command.toLowerCase();
    const arg = space > -1 ? command.slice(space + 1) : null;

    // console.log("com:", command);

    switch (func) {
        case 'draw': 
            if(!arg) {
                println("'draw' requires 1 argument\nFor more info, use 'help draw'");
                return;
            }
            graph.style.display = "inline-block";
            shell.style.display = "none";
            gr.draw(makeFunc(parse(tokenize(arg))), true);
            println("Successfully graphed 1 function");
            return;
        case 'calc': {
            if(!arg) {
                println("'calc' requires 1 argument\nFor more info, use 'help calc'");
                return;
            }
            const res = evaluate(parse(tokenize(arg))).toString();
            println(res);
            return;
        }
        case 'cls':
            lines = [];
            return;
        case 'help':
            if(!arg) {
                println("Available commands:\ndraw [function]\ncalc [expression]\ncls\nhelp [command]?");
                return;
            }
            println("placeholder");
            return;
    }
    println(`Unrecognized command '${func}'`);
};

shell.addEventListener('keydown', (e) => {
    e.preventDefault();
    if(e.key.length === 1) {
        const char = e.key;
        insert(char);
    }
    else if(e.key === "Backspace") {
        remove();
    }
    else if(e.key === "Delete") {
        if(caret === getLine().length + getLine().start) return;
        caret++;
        remove();
    }
    else if(e.key === "Enter") {
        handleCommand();
        println(head, head.length);
    }
    else if(e.key === 'ArrowLeft') {
        if(caret <= getLine().wall + getLine().start) return;
        caret--;
    }
    else if(e.key === 'ArrowRight') {
        if(caret >= getLine().start + getLine().text.length) return;
        caret++;
    }
    render();
})

document.addEventListener('keydown', (e) => {
    e.preventDefault();
    if(e.key === 'Escape') {
        graph.style.display = "none";
        shell.style.display = "inline-block";
        shell.focus();
    }
});

document.body.addEventListener('mousedown', () => {
    console.log(lines);
})


print("fib")
render();
console.log(lines);