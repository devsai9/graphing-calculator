class GDirectory {
    name;
    parent = null;
    children = [];
    deleted = [];

    constructor(name) {
        if(typeof name !== "string") name = name.toString();
        this.name = name;
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
        this.children[found] = null;
        this.deleted.push(found);
    }

    find(name) {

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

    constructor(name, extension) {
        this.name = name.toString();
        this.parent = null;
        this.extension = extension.toString().toLowerCase();
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

const root = new GDirectory("#");
let currentdir = root;

const newDir = (name) => {
    if(name === "#") throw new Error("The name '#' is reserved for the root directory");
    return new GDirectory(name);
};

const newFile = (name, extension) => new GFile(name, extension);

export { root, currentdir, newDir, newFile };