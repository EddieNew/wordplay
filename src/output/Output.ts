import type Value from '../runtime/Value';

/**
 * A base class that represents some part of Verse output.
 * It's core responsibility is to store a link to a Structure value,
 * maintaining provenance.
 * */
export default class Output {
    /**
     * The value on which this output component is based.
     * If undefined, it means it was generated by the system and not by code.
     * */
    readonly value: Value;

    constructor(value: Value) {
        this.value = value;
    }
}
