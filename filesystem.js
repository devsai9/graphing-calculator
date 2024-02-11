class GDirectory {
    name;
    parent = null;
    children = [];
    deleted = [];
    vital;

    constructor(name, vital=false) {
        if(typeof name !== "string") name = name.toString();
        this.name = name;
        this.vital = vital;
    }

    addChild(sub) {
        let subtype = 0;
        if(sub.constructor.name === "GDirectory") subtype = 1;
        else if(sub.constructor.name === "GFile") subtype = 2;
        if(subtype === 0) throw new Error("Can only add files or other directories to this directory"); 
        for(let i = 0; i < this.children.length; i++) {
            const current = this.children[i];
            if(current === null) continue;
            const currenttype = current.constructor.name === "GFile" ? 2 : 1;
            if(subtype !== currenttype) continue;
            if(current.name === sub.name) {
                let problem = null;
                if(subtype === 1) problem = "subdirectory";
                else if(sub.extension === current.extension) problem = "file";
                if(problem !== null) throw new Error(`A ${problem} with the name '${sub.fullname}' already exists`);
            }
        }

        if(subtype === 1) {
            let recursivechecker = this;
            while(true) {
                if(recursivechecker === null) break;
                if(recursivechecker === sub) throw new Error("Adding this directory will result in circular directories");
                recursivechecker = recursivechecker.parent;
            }
        }

        if(sub.vital && !this.vital) throw new Error("Illegal action");

        if(sub.parent !== null) sub.parent.deleteChild(sub.fullname);
        sub.parent = this;
        if(this.deleted.length === 0) this.children.push(sub);
        else this.children[this.deleted.pop()] = sub;
    }

    deleteChild(subname) {
        let found = -1;
        for(let i = 0; i < this.children.length; i++) {
            const current = this.children[i];
            if(current === null) continue;
            if(current.fullname === subname) {
                found = i;
                break;
            }
        }
        if(found === -1) throw new Error(`No file or directory with the name '${subname}' exists`);
        if(this.children[found].vital) throw new Error(`You do not have permission to delete '${subname}'`);
        this.children[found] = null;
        this.deleted.push(found);
    }

    find(name) {
        let found = -1;
        for(let i = 0; i < this.children.length; i++) {
            if(this.children[i] === null) continue;
            if(this.children[i].fullname === name) {
                found = i;
                break;
            }
        }
        if(found === -1) throw new Error(`No file or directory with the name '${name}' exists`);
        return this.children[found];
    }

    cleanup() {
        const compact = [];
        if(this.deleted.length === 0) return;
        for(let i = 0; i < this.children.length; i++) {
            if(this.deleted.length === 0) break;
            if(this.children[i] === null) {
                this.deleted.pop();
                continue;
            }
            compact.push(this.children[i]);
        }
        this.children = compact;
    }

    get fullname() {
        return this.name;
    }

    get childcount() {
        return this.children.length - this.deleted;
    }


}

class GFile {
    name;
    parent;
    extension;
    content = "";
    vital;

    constructor(name, extension, vital=false) {
        this.name = name.toString();
        this.parent = null;
        this.extension = extension.toString().toLowerCase();
        this.vital = vital;
    }

    get fullname() {
        return this.name + "." + this.extension;
    }

    setContent(str) {
        str = str.toString();
        this.content = str;
    }

    addContent(str) {
        str = str.toString();
        this.content += str;
    }
}

const root = new GDirectory("#", true);
let currentdir = root;

const setCurrent = (dir) => {
    currentdir = dir;
}

const newDir = (name) => {
    if(name === "#") throw new Error("The name '#' is reserved for the root directory");
    else if(name === ".") throw new Error("The name '#' is reserved for the current directory");
    else if(name === "..") throw new Error("The name '#' is reserved for the parent directory");
    else if(/\//.test(name)) throw new Error("Illegal character '/'");
    return new GDirectory(name);
};

const newFile = (name, extension) => new GFile(name, extension);

const getPath = (fnode) => {
    let str = fnode.fullname;
    let dir = fnode.parent;
    while(dir !== null) {
        str = dir.name + "/" + str;
        dir = dir.parent;
    }
    return str;
}

const toPath = (str) => {
    return str.split("/");
}

const findRecursive = (path) => {
    let search;
    let tried = false;
    for(let i = 0; i < path.length; i++) {
        if(i === 0 && !tried) {
            if(path[0] === "#") search = root;
            else if(path[0] === ".") search = currentdir;
            else if(path[0] === "..") search = currentdir.parent || root;
            else try {
                search = currentdir.find(path[0]);
            } catch(e) {
                search = root.find(path[0]);
            }
        }
        else try {
            search = search.find(path[i]);
        } catch(e) {
            if(tried) throw e;
            search = root;
            tried = true;
            i = 1;
        }
    }
    return search;
}

let d1 = new GDirectory("Apps", true);
root.addChild(d1);

export { root, currentdir, setCurrent, newDir, newFile, getPath, toPath, findRecursive };