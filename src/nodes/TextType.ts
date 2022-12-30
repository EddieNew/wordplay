import type { NativeTypeName } from '../native/NativeConstants';
import { TEXT_SYMBOL } from '../parser/Tokenizer';
import Language from './Language';
import NativeType from './NativeType';
import type Node from './Node';
import Token from './Token';
import TokenType from './TokenType';
import type Translations from './Translations';
import { TRANSLATE } from './Translations';
import type TypeSet from './TypeSet';

/** Any string or a specific string, depending on whether the given token is an empty text literal. */
export default class TextType extends NativeType {
    readonly text: Token;
    readonly format?: Language;

    constructor(text: Token, format?: Language) {
        super();

        this.text = text;
        this.format = format;

        this.computeChildren();
    }

    static make(format?: Language) {
        return new TextType(new Token(TEXT_SYMBOL, TokenType.TEXT), format);
    }

    getGrammar() {
        return [
            { name: 'text', types: [Token] },
            { name: 'format', types: [Language, undefined] },
        ];
    }

    clone(original?: Node, replacement?: Node) {
        return new TextType(
            this.replaceChild('text', this.text, original, replacement),
            this.replaceChild('format', this.format, original, replacement)
        ) as this;
    }

    computeConflicts() {}

    acceptsAll(types: TypeSet): boolean {
        // For this to accept the given type, it must accept all possible types.
        return types.list().every((type) => {
            // If the possible type is not text, it is not acceptable.
            if (!(type instanceof TextType)) return false;
            // If:
            // 1) this is any text, or its specific text that a possible type matches
            // 2) this has no required format, or they have matching formats
            if (
                !(
                    (this.getText() === '' ||
                        this.text.getText() === type.text.getText()) &&
                    (this.format === undefined ||
                        (type.format !== undefined &&
                            this.format.equals(type.format)))
                )
            )
                return false;
            return true;
        });
    }

    /** Strip the delimiters from the token to get the text literal that defines this type. */
    getText() {
        const text = this.text.getText();
        return text.substring(1, text.length - 1);
    }

    getNativeTypeName(): NativeTypeName {
        return 'text';
    }

    getDescriptions(): Translations {
        return {
            '😀': TRANSLATE,
            eng: 'a text type',
        };
    }
}
