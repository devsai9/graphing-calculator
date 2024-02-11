import * as gr from './graph.js';
import {tokenize, parse, evaluate, makeFunc} from './parser.js';
import * as fs from './filesystem.js';
let head = "graph " + fs.getPath(fs.currentdir) + "> ";
const shell = document.querySelector("#shell");
const graph = document.querySelector("#graph");
//let line = 0;
let caret = head.length;
let lines = [{
    start: 0,
    wall: head.length,
    text: head
}];

let comHistory = [""];
let comIndex = 0;

function render() {
    shell.value = "";
    for(let i = 0; i < lines.length; i++) {
        if(i !== 0) shell.value += "\n";
        shell.value += lines[i].text;
    }
    shell.scrollTop = shell.scrollHeight;
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
    str = str || "";
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
});

shell.value = head;

const commands = {
    "help": {
        run: (args) => {
            if(args.length === 0) {
                println("Available commands:");
                for(const [k, v] of Object.entries(commands)) {
                    println(v.syntax);
                }
                println("\nTo learn more about a command, type 'help' followed by that command");
            }
            else {
                if(args.length > 1) println("Warning: only 1 argument is required, the rest will be ignored");
                const command = args[0];
                if(!(command in commands)) throw new Error(`'${command}' is not a command`);
                println(commands[command].details);
            }
        },
        syntax: "help [command?]",
        details: "-Use 'help' to get a list of available commands\n-Use 'help' followed by a command to learn more about the command\n  *Ex: help draw"
    },
    "cls": {
        run: (args) => {
            lines = [];
        },
        syntax: "cls",
        details: "-Use 'cls' to clear the screen"
    },
    "clh": {
        run: (args) => {
            comHistory = [""];
            comIndex = 0;
        },
        syntax: "clh",
        details: "-Use 'clh' to clear the command history"
    },
    "calc": {
        run: (args) => {
            if(args.length === 0) throw new Error("The command 'calc' expects 1 argument");
            const expr = args[0];
            const res = evaluate(parse(tokenize(expr))).toString();
            println(res);
        },
        runoff: true,
        syntax: "calc [expression]",
        details: "-Use 'calc' followed by an expression to evaluate it\n  *Ex: calc (1.5-3)*6^2"
    },
    "draw": {
        run: (args) => {
            if(args.length === 0) throw new Error("The command 'draw' expects 1 argument");
            const expr = args[0];
            const func = makeFunc(parse(tokenize(expr)));
            func(0);
            graph.style.display = "inline-block";
            shell.style.display = "none";
            gr.draw(func, true);
            println("Success");
        },
        runoff: true,
        syntax: "draw [expression]",
        details: "-Use 'draw' followed by a math expression to graph it as a function of x\n  *Ex: draw x^2+2x-3"
    },
    "ls": {
        run: (args) => {
            let dir = null;
            if(args.length === 0) dir = fs.currentdir;
            else {
                const path = fs.toPath(args[0]);
                dir = fs.findRecursive(path);
                if(dir.constructor.name === "GFile") throw new Error(`'${path[path.length - 1]}' is not a directory`);
            }
            dir.children.forEach(fnode => {
                if(fnode === null) return;
                println(fnode.fullname);
                if(fnode.vital) print("*");
            });
        },
        runoff: true,
        syntax: "ls [directory?]",
        details: "-Use 'ls' followed by a directory path to list the subdirectories and files in that directory; if a path is not provided, the current directory will be used\n  *Ex: ls #/Apps, ls ./Module"
    },
    "cd": {
        run: (args) => {
            if(args.length === 0) throw new Error("The command 'cd' expects 1 argument");
            const path = fs.toPath(args[0]);
            const dir = fs.findRecursive(path);
            if(dir.constructor.name === "GFile") throw new Error(`'${path[path.length - 1]}' is not a directory`);
            fs.setCurrent(dir);
            head = `graph ${fs.getPath(dir)}> `;
        },
        runoff: true,
        syntax: "cd [directory]",
        details: "-Use 'cd' followed by a directory path to change the current directory"
    },
    "mkdir": {
        run: (args) => {
            if(args.length === 0) throw new Error("The command 'mkdir' expects 1 argument");
            const dir = fs.newDir(args[0]);
            fs.currentdir.addChild(dir);
        },
        runoff: true,
        syntax: "mkdir [directory]",
        details: "-Use 'mkdir' followed by a directory name to create a new directory with that name"
    },
    "rmdir": {
        run: (args) => {
            if(args.length === 0) throw new Error("The command 'rmdir' expects 1 argument");
            const path = fs.toPath(args[0]);
            const dir = fs.findRecursive(path);
            if(dir.constructor.name !== "GDirectory") throw new Error(`'${dir.fullname}' is not a directory`);
            if(dir.parent === null) {
                throw new Error("You do not have permission to delete this directory...\n\nLike seriously WHY ARE YOU ATTEMPTING TO DELETE THE ROOT DIRECTORY????");
            }

            let parentcheck = fs.currentdir;
            while(parentcheck !== null) {
                if(parentcheck === dir) throw new Error(`Cannot delete '${dir.fullname}' as it affects the current directory`);
                parentcheck = parentcheck.parent;
            }
            dir.parent.deleteChild(dir.fullname);
        },
        runoff: true,
        syntax: "rmdir [directory]",
        details: "-Use 'rmdir' followed by the directory name to delete it if you have permission"
    },
    "echo": {
        run: (args) => {
            if(args.length === 0) throw new Error("The command 'echo' expects 1 argument");
            println(args[0]);
        },
        runoff: true,
        syntax: "echo [string]",
        details: "-Use 'echo' followed by a string to print it"
    }
};

const handleCommand = () => {
    const lineRaw = getLine().text.slice(head.length);
    const line = lineRaw.trim().replace(/\s+/g, ' ');
    if(line === "" || line === " ") return; 

    if(lineRaw !== comHistory[comHistory.length - 2]) {
        comHistory[comHistory.length - 1] = lineRaw;
        comHistory.push("");
        comIndex = comHistory.length - 1;
    }

    const space = line.indexOf(" ");
    const command = space > -1 ? line.slice(0, space).toLowerCase() : line.toLowerCase();
    const argstr = space == -1 ? null : line.slice(space + 1);

    if(!(command in commands)) {
        println(`Unrecognized command '${command}'`);
        return;
    }

    const com = commands[command];
    let args;
    if(argstr === null || argstr.length === 0) args = [];
    else args = com.runoff ? [argstr] : argstr.split(" ");
    
    com.run(args);
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
        try {
            handleCommand();
        }
        catch(e) {
            println("ERROR:\n" + e.message);
            //console.error(e);
        }
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
    else if(e.key === 'ArrowUp') {
        if(comIndex < 1) return;
        comHistory[comIndex] = getLine().text.slice(head.length);
        comIndex--;
        const linelen = getLine().text.length - head.length;
        getLine().text = head;
        caret -= linelen;
        print(comHistory[comIndex]);
    }
    else if(e.key === 'ArrowDown') {
        if(comIndex === comHistory.length - 1) return;
        comHistory[comIndex] = getLine().text.slice(head.length);
        comIndex++;
        const linelen = getLine().text.length - head.length;
        getLine().text = head;
        caret -= linelen;
        print(comHistory[comIndex]);
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
    console.log(comHistory, comIndex);
})


// print("fib")
render();
// console.log(lines);