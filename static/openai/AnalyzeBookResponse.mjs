import { Entry } from "../library/Entry.mjs"

function notNull(value) {
    return value != null
}

function ifDefined(field, response) {
    if (field in response) return response[field]
}

/**
 * @param {string} input 
 * @param {string[]} leadingNoise 
 * @returns 
 */
function stripAINoise(input, leadingNoise = []) {
    if (input == null) {
        return ''
    } else if (typeof input == 'string') {
        const EmptyValueAliases = ['null', 'undefined', 'not available', 'not specified', 'unknown']
        if (EmptyValueAliases.includes(input.toLowerCase()))
            return ''
        if (leadingNoise.length > 0) {
            for (const leading of leadingNoise) {
                if (input.startsWith(leading)) {
                    return input.substring(leading.length)
                }
            }
        }
    }
    return input.toString()
}

export class AnalyzeBookResponse {
    /** @type{Entry[]} */
    #interpretations
    #section

    /**
     * @param {unknown} response 
     * @param {string} section 
     */
    constructor(response, section) {
        this.#interpretations = []
        this.#section = section
        if (Array.isArray(response)) {
            this.#interpretations = AnalyzeBookResponse.parseArray(response, section)
        } else if (typeof response === 'object' && response != null) {
            if ('interpretations' in response && Array.isArray(response['interpretations'])) {
                this.#interpretations = AnalyzeBookResponse.parseArray(response['interpretations'], section)
            } else if ('title' in response && 'mediaType' in response) {
                this.#interpretations = [AnalyzeBookResponse.parse(response, section)].filter(notNull)
            } else {
                throw new Error('Unable to parse response:\n' + JSON.stringify(response, undefined, 2))
            }
        }
    }

    get interpretations() { return this.#interpretations }

    get section() { return this.#section }

    static parseArray(response, section) {
        return response.map(res => AnalyzeBookResponse.parse(res, section)).filter(notNull)
    }

    static parse(response, section) {
        // response must contain required fields
        if (!('title' in response) || !('mediaType' in response)) {
            return null
        }
        function directlyParse(keys, src) {
            const obj = {}
            keys.forEach(key => {
                obj[key] = stripAINoise(ifDefined(key, src))
            });
            return obj
        }

        const year = ifDefined('yearPublished', response)
        const month = ifDefined('monthPublished', response)
        let publishedOn = ""
        if (year && month) {
            publishedOn = stripAINoise(`${month} ${year}`)
        } else if (year) {
            publishedOn = stripAINoise(year)
        } else if (month) {
            publishedOn = stripAINoise(month)
        }
        const entry = new Entry(
            response['title'],
            response['mediaType'],
            {
                section,
                publishedOn,
                ...directlyParse([
                    'author',
                    'publishedBy',
                    'publishedLocation',
                    'edition',
                    'editionYear',
                    'serialNumber',
                    'catalogNumber'
                ], response)
            })

        return entry
    }
}