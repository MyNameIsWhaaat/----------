const input = document.querySelector("input")
const p = document.querySelector("p")
const a = document.querySelector("a")

input.addEventListener("change", obfuscation)

function obfuscation() {
    const file = this.files[0]
    const fileReader = new FileReader()
    const aliases = new Map()

    fileReader.onload = () => {
        let text = fileReader.result
        text = text.replaceAll(/\n{2,}/g, "\n")
        let lines = text.split("\n")

        for (let i=0; i<lines.length; i++) { // находим ифы и форы чтобы поставить скобки
            lines[i] = lines[i].trim()
            if (startWithKeyWord(lines[i])) {
                if (notEndOrStartWithBracket(lines[i]) && notEndOrStartWithBracket(lines[i+1])) {
                    let expression = lines[i].match(/\(([^)]+)\)/)[0]
                    lines[i] = lines[i].replace(expression, expression + " { ")
                    if (!lines[i].endsWith("{ ")) {
                        lines[i] += " }"
                    }
                    else {
                        lines[i+1] += " }"
                    }
                }
            }
        }
//Comment
        function startWithKeyWord(line) {
            return line.startsWith("if") || line.startsWith("for") || line.startsWith("while")
        }

        function notEndOrStartWithBracket(line) {
            return !line.endsWith("{") && !line.endsWith("}") && !line.startsWith("{") && !line.startsWith("}")
        }

        text = lines.join("\n")
            .replaceAll(",", " , ")
            .replaceAll(".", " . ")
            .replaceAll("=", " = ")
            .replaceAll("-", " - ")
            .replaceAll("+", " + ")
            .replaceAll("!", " ! ")
            .replaceAll("?", " ? ")
            .replaceAll("\"", " ` ")
            .replaceAll("'", " ` ")
            .replaceAll("(", " ( ")
            .replaceAll(")", " ) ")
            .replaceAll("[", " [ ")
            .replaceAll("]", " ] ")
            .replaceAll("{", " { ")
            .replaceAll("}", " } ")
            .replaceAll("<", " < ")
            .replaceAll(">", " > ")
            .replaceAll(";", " ; ")
            .replaceAll(":", " : ")
            .replaceAll(/\/\*(.|[\r\n])*?\*\/|\/\/.*/g, " ")
            .replaceAll(/\s{2,}/g, " ")

        const words = text.split(" ")
        const resultWords = []

        let listOfTextBlocks = []
        let listOfBracketCounts = [] //количество фигурных скобок
        let circleBracketsCount = 0 //круглые скобки
        let isStartCountCircleBrackets = false

        for (let i=0; i<words.length; i++) {
            if (words[i] === "if" || words[i] === "for" || words[i] === "while") {
                isStartCountCircleBrackets = true
                listOfTextBlocks.push(
                    [words[i]]
                )
                listOfBracketCounts.push(0)
            }
            else if (isStartCountCircleBrackets) {
                listOfTextBlocks[listOfTextBlocks.length-1].push(words[i])
                if (words[i] === "(") {
                    circleBracketsCount++
                }
                else if (words[i] === ")") {
                    circleBracketsCount--
                }
                if (circleBracketsCount === 0) {
                    isStartCountCircleBrackets = false
                }
            }
            else if (words[i] === "}" && listOfTextBlocks.length !== 0) {
                if (listOfBracketCounts[listOfBracketCounts.length-1] === 1) {
                    listOfBracketCounts.pop()
                    listOfTextBlocks[listOfTextBlocks.length-1].push("}")

                    let functionName = rename()
                    let textBlock = listOfTextBlocks.pop()
                    let blockInFunction = `function ${functionName} ( ) { ${textBlock.join(" ")} } ${functionName} ( ) `
                    if (listOfTextBlocks.length > 0) {
                        listOfTextBlocks[listOfTextBlocks.length-1].push(blockInFunction)
                    }
                    else {
                        resultWords.push(blockInFunction)
                    }
                }
                else if (listOfBracketCounts.length !== 0) {
                    listOfBracketCounts[listOfBracketCounts.length-1]--
                    listOfTextBlocks[listOfTextBlocks.length-1].push("}")
                }
            }
            else if (words[i] === "{" && listOfTextBlocks.length !== 0) {
                listOfBracketCounts[listOfBracketCounts.length-1]++
                listOfTextBlocks[listOfTextBlocks.length-1].push(words[i])
            }
            else if (words[i] === "let" || words[i] === "var" || words[i] === "const" || words[i] === "function") {
                if (listOfTextBlocks.length === 0) {
                    resultWords.push(words[i])
                    const newName = rename()

                    aliases.set(words[++i], newName)
                    resultWords.push(newName)
                }
                else {
                    const newName = rename()

                    aliases.set(words[i+1], newName)
                    listOfTextBlocks[listOfTextBlocks.length-1].push(words[i++], newName)
                }
            }
            else if (aliases.has(words[i])) {
                if (listOfTextBlocks.length === 0) {
                    resultWords.push(aliases.get(words[i]))
                }
                else {
                    listOfTextBlocks[listOfTextBlocks.length-1].push(words[i])
                }
            }
            else {
                if (listOfTextBlocks.length === 0) {
                    resultWords.push(words[i])
                }
                else {
                    listOfTextBlocks[listOfTextBlocks.length-1].push(words[i])
                }
            }
        }

        let resultText = resultWords.join(" ")
        resultText = resultText
            .replaceAll(" ,", ",")
            .replaceAll(" .", ".")
            .replaceAll(" =", "=")
            .replaceAll(" -", "-")
            .replaceAll(" +", "+")
            .replaceAll(" !", "!")
            .replaceAll(" ?", "?")
            .replaceAll(" ;", ";")
            .replaceAll(" :", ":")
            .replaceAll(" {", "{")
            .replaceAll("{ ", "{")
            .replaceAll(" }", "}")
            .replaceAll(" ", "\n")

        const newFile = new Blob([resultText], {type: "text/js"})
        const url = URL.createObjectURL(newFile)
        a.download = "Obfuscated_" + file.name
        a.href = url
        a.innerHTML = "File is ready"
        p.innerHTML = resultText
    }

    if (file) {
        fileReader.readAsText(file)
    }
}

function rename() {
    return String.fromCodePoint(Math.floor(Math.random() * 26 + 97)) + crypto.randomUUID().replaceAll("-", "")
}
