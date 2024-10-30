import { Entry } from "./Entry";
import { Section } from "./Section";

export class Library {
    #sections

    constructor(entries) {
        this.#sections = []
        let currentSection = undefined
        entries.forEach(result => {
            if (!currentSection) {
                currentSection = new Section(result.section)
            } else if (!currentSection.shouldInclude(result)) {
                this.#sections.push(currentSection)
                currentSection = new Section(result.section)
            }
            currentSection.entries.push(result)
        })
        if (currentSection) {
            this.#sections.push(currentSection)
        }
    }

    static async fromResponse(res) {
        const data = await res.json()
        return new Library(data.results.map(Entry.fromJSON))
    }

    get sections() { return this.#sections }

    update(entry) {
        let isNew = true
        this.#sections.forEach(section => {
            if (isNew && section.includes(entry.id)) {
                section.update(entry)
                isNew = false
            }
        })

        if (isNew) {
            if (this.#sections.length == 0 || this.#sections[0].name !== "New Entries") {
                const newSection = new Section("New Entries")
                this.#sections = [newSection, ...this.#sections]
            }
            this.#sections[0].entries.unshift(entry)
        }
        return this
    }

    remove(entry) {
        for (let i = 0; i < this.#sections.length; i++) {
            this.#sections[i].remove(entry.id)
        }
        return this
    }
}