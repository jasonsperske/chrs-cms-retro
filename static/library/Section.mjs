import { Entry } from "./Entry"

export class Section {
    #name
    #entries

    constructor(name, entries = []) {
        this.#name = name || ""
        this.#entries = entries
    }

    get name() { return this.#name }
    get entries() { return this.#entries }

    shouldInclude(entry) {
        return this.#name === (entry.section || "")
    }

    includes(id) {
        return id ? this.#entries.some(entry => entry.id === id) : false
    }

    update(update) {
        this.#entries = this.#entries.map(entry => entry.is(update) ? update : entry)
        return this
    }

    remove(id) {
        if (id) {
            this.#entries = this.#entries.filter(entry => entry.id !== id)
        }
        return this
    }
}