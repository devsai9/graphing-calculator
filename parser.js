class Stack {
    #arr;

    constructor() {
        this.#arr = [];
    }

    push(item) {
        this.#arr.push(item);
    }

    pop() {
        return this.#arr.pop();
    }

    top() {
        return this.#arr[this.#arr.length - 1];
    }

    isEmpty() {
        return this.#arr.length === 0;
    }
}

const isOp = (str, i) => {
    const code = str.charCodeAt(i);
    return (code === 37) || (code === 42) || (code === 43) || (code === 45) || (code === 47) || (code === 94);
}

/*
const isUn = (str, i) => {
    const code = str.charCodeAt(i);
    return code === 45;
}*/

const isNum = (str, i) => {
    const code = str.charCodeAt(i);
    return (47 < code) && (code < 58);
}

const isAlpha = (str, i) => {
    const code = str.charCodeAt(i);
    return (64 < code && code < 91) || (96 < code && code < 123);
}

const tokenize = (str) => {
    let p = 0;
    let r = 0;
    const tokens = [];
    const parmap = [];
    const parstack = [];
    let previous = null;
    while(p < str.length) {
        let generated;
        if(str[p] === ' ') {
            p++;
            continue;
        }
        else if(isOp(str, p)) {
            if(unary[str[p]]) {
                // Ambiguous case
                if(!previous || previous.type === "binary" || previous.type === "unary") generated = {
                    type: "unary",
                    lexeme: str[p]
                };
                else generated = {
                    type: "binary",
                    lexeme: str[p]    
                };
                p++;
                r++;
            } else {
                generated = {
                    type: "binary",
                    lexeme: str[p]
                };
                p++;
                r++;
            }
        }
        else if(unary[str[p]]) {
            generated = {
                type: "unary",
                lexeme: str[p]
            };
            p++;
            r++;
        }
        else if(isNum(str, p)) {
            let start = p;
            while(isNum(str, p)) p++;
            if(str.charCodeAt(p) === 46) {
                p++;
                while(isNum(str, p)) p++;
            }
            generated = {
                type: "number",
                lexeme: str.slice(start, p)
            };
            r++;
        }
        else if(isAlpha(str, p)) {
            let start = p;
            while(isAlpha(str, p) || isNum(str, p)) p++;
            generated = {
                type: "identifier",
                lexeme: str.slice(start, p)
            };
            r++;
        }
        else if(str.charCodeAt(p) === 61) {
            generated = {
                type: "equals",
                lexeme: null
            };
            p++;
            r++;
        }
        else if(str.charCodeAt(p) === 40) {
            parstack.push(r);
            generated = {
                type: "lpar",
                lexeme: null
            };
            p++;
            r++;
        }
        else if(str.charCodeAt(p) === 41) {
            if(parstack.length === 0) throw new Error("Mismatched parentheses");
            const i = parstack.pop();
            parmap[i] = r;
            parmap[r] = i;
            generated = {
                type: "rpar",
                lexeme: null
            };
            p++;
            r++;
        }
        else {
            throw new Error("Illegal character: " + str[p]);
        }
        tokens.push(generated);
        previous = generated;
    }
    if(parstack.length !== 0) throw new Error("Mismatched parentheses"); 
    return {
        tokens,
        parmap
    };
}

const precmap = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
    '^': 3
};

const rass = {
    3: true
};

const unary = {
    '+': true,
    '-': true
}

const makeBin = (glyph, left, right) => {
    return {
        type: "binary",
        glyph: glyph,
        left: left,
        right: right
    };
};

const makeNum = (num) => {
    return {
        type: "number",
        value: num
    }
};

const makeIdt = (name) => {
    return {
        type: "identifier",
        value: name
    }
};

const makeUn = (glyph, child) => {
    return {
        type: "unary",
        glyph: glyph,
        child: child
    }
}

const parse = (data, start, end) => {
    const tokens = data.tokens;
    const parmap = data.parmap;
    if(start === undefined) start = 0;
    if(end === undefined) end = tokens.length;
    let root = null;
    let exposed = null;
    let graftstack = new Stack();
    const consumer = {root: null, exposed: null};
    for(let i = start; i < end; i++) {
        let currentToken = tokens[i];
        if(consumer.root) {
            let endUnary = i + 1;
            while(true) {
                if(endUnary === end) break;
                if(tokens[endUnary].type !== "binary") {
                    endUnary++;
                    continue;
                };
                if(precmap[tokens[endUnary].lexeme] <= precmap[consumer.root.glyph]) break;
                endUnary++;
            }
            const unNode = parse(data, i, endUnary);
            consumer.exposed.child = unNode;
            if(!root) root = consumer.root;
            else if(exposed && !exposed.right) {
                exposed.right = consumer.root;
            }
            consumer.root = null;
            consumer.exposed = null;
            i = endUnary - 1;
        }
        else if(currentToken.type === 'lpar') {
            const parnode = parse(data, i + 1, parmap[i]);
            i = parmap[i];
            if(!root) root = parnode;
            else if(exposed && !exposed.right) {
                exposed.right = parnode;
            }
        }
        else if(currentToken.type === 'rpar') {
            console.log("this should't happen");
        }
        else if(currentToken.type === 'number') {
            if(!root) root = makeNum(currentToken.lexeme);
            else if(exposed && !exposed.right) {
                exposed.right = makeNum(currentToken.lexeme);
            }
        }
        else if(currentToken.type === 'identifier') {
            if(!root) root = makeIdt(currentToken.lexeme);
            else if(exposed && !exposed.right) {
                exposed.right = makeIdt(currentToken.lexeme);
            }
        }
        else if(currentToken.type === 'binary') {
            if(!exposed) {
                const node = makeBin(currentToken.lexeme, root, null);
                exposed = node;
                root = node;
                continue;
            }
            const precPrev = precmap[exposed.glyph];
            const precCurr = precmap[currentToken.lexeme];
            if(precCurr > precPrev || (precCurr === precPrev && rass[precCurr])) {
                const node = makeBin(currentToken.lexeme, exposed.right, null);
                graftstack.push(exposed);
                exposed.right = node;
                exposed = node;
            }
            else if(precCurr < precPrev || (precCurr === precPrev && !rass[precCurr])) {
                while(true) {
                    if(graftstack.isEmpty()) break;
                    if(precmap[graftstack.top().glyph] < precCurr) break;
                    graftstack.pop();
                }
                if(graftstack.isEmpty()) {
                    const node = makeBin(currentToken.lexeme, root, null);
                    root = node;
                    exposed = node;
                }
                else {
                    const node = makeBin(currentToken.lexeme, graftstack.top().right, null);
                    root = node;
                    exposed = node;
                }
            }
        }
        else if(currentToken.type === "unary") {
            if(!consumer.root && !consumer.exposed) {
                consumer.root = makeUn(currentToken.lexeme, null);
                consumer.exposed = consumer.root;
            }
            else if(consumer.exposed) {
                const node = makeUn(currentToken.lexeme, null);
                consumer.exposed.child = node;
                consumer.exposed = node;
            }
        }
    }
    return root;
};

const evaluate = (tree, context) => {
    if(context === undefined) context = {};
    if(tree.type === "number") return Number(tree.value);
    if(tree.type === "binary") {
        const a = evaluate(tree.left, context);
        const b = evaluate(tree.right, context);
        switch(tree.glyph) {
            case '+': return a + b;
            case '-': return a - b;
            case '*': return a * b;
            case '/': return a / b;
            case '^': return a ** b;
        }
    }
    if(tree.type === "unary") {
        const x = evaluate(tree.child, context);
        switch(tree.glyph) {
            case '+': return x;
            case '-': return -x;
        }  
    }
    if(tree.type === "identifier") {
        console.log(tree.value);
        console.log(context);
        if(context[tree.value] !== undefined) return context[tree.value];
        else throw new Error(`Undefined variable '${tree.value}'`);
    }
}

const makeFunc = (tree, context={}) => {
    return (x) => evaluate(tree, {...context, 'x': x});
};

// - x ^ 2 + 28
const t = tokenize("+ 1 +-++++----+++--+ 2");
//console.log(t)
const p = parse(t);
//console.log(p)
// const obj = {
//     'x': 36
// }
console.log(evaluate(p))
//const func = makeFunc(p);
//console.log(func(3));

