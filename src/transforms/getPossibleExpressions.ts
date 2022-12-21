import AnyType from "../nodes/AnyType";
import Block from "../nodes/Block";
import BooleanLiteral from "../nodes/BooleanLiteral";
import BooleanType from "../nodes/BooleanType";
import Conditional from "../nodes/Conditional";
import type Context from "../nodes/Context";
import ConversionDefinition from "../nodes/ConversionDefinition";
import Expression from "../nodes/Expression";
import ExpressionPlaceholder from "../nodes/ExpressionPlaceholder";
import FunctionDefinition from "../nodes/FunctionDefinition";
import KeyValue from "../nodes/KeyValue";
import Language from "../nodes/Language";
import ListLiteral from "../nodes/ListLiteral";
import MapLiteral from "../nodes/MapLiteral";
import MeasurementLiteral from "../nodes/MeasurementLiteral";
import Previous from "../nodes/Previous";
import Reaction from "../nodes/Reaction";
import SetLiteral from "../nodes/SetLiteral";
import StructureDefinition from "../nodes/StructureDefinition";
import Template from "../nodes/Template";
import TextLiteral from "../nodes/TextLiteral";
import Type from "../nodes/Type";
import TypePlaceholder from "../nodes/TypePlaceholder";
import type Node from "../nodes/Node";
import Name from "../nodes/Name";
import type Definition from "../nodes/Definition";
import TypeVariable from "../nodes/TypeVariable";
import Reference from "../nodes/Reference";
import Replace from "./Replace";
import Append from "./Append";
import { getPossibleLanguages } from "./getPossibleLanguages";
import { getPossibleUnits } from "./getPossibleUnits";
import type Refer from "./Refer";
import BinaryOperation from "../nodes/BinaryOperation";
import ListType from "../nodes/ListType";
import ListAccess from "../nodes/ListAccess";
import MapType from "../nodes/MapType";
import SetType from "../nodes/SetType";
import SetOrMapAccess from "../nodes/SetOrMapAccess";
import StreamType from "../nodes/StreamType";
import Convert from "../nodes/Convert";
import Names from "../nodes/Names";
import Token from "../nodes/Token";
import TokenType from "../nodes/TokenType";
import { STREAM_SYMBOL } from "../parser/Tokenizer";

/** Offer possible expressions compatible with the given type, or if none was given, any possible expression */
export default function getPossibleExpressions(parent: Node, child: Expression | undefined, context: Context, type?: Type): (Expression | Definition)[] {

    const project = context.project;

    return [
        ...parent.getAllDefinitions(parent, context),
        ...(child === undefined ? [] : [ new Block([ child ], false, false) ]),
        new BooleanLiteral(true),
        new BooleanLiteral(false),
        ...[ MeasurementLiteral.make(), ... (project === undefined ? [] : getPossibleUnits(project).map(u => MeasurementLiteral.make(undefined, u))) ],
        ...[ TextLiteral.make(), ... (project === undefined ? [] : getPossibleLanguages(project).map(l => TextLiteral.make(undefined, Language.make(l)))) ],
        new Template(new Token('"\\', TokenType.TEXT_OPEN), [ new ExpressionPlaceholder(), new Token('\\"', TokenType.TEXT_CLOSE)]),
        ...(child instanceof Expression && child.getType(context) instanceof BooleanType ? [ Conditional.make( child, new ExpressionPlaceholder(), new ExpressionPlaceholder()) ] : [] ),
        Conditional.make(new ExpressionPlaceholder(), new ExpressionPlaceholder(), new ExpressionPlaceholder()),
        Block.make([ new ExpressionPlaceholder() ]),
        ListLiteral.make([]),
        SetLiteral.make([]),
        MapLiteral.make([ new KeyValue(new ExpressionPlaceholder(), new ExpressionPlaceholder())]),
        FunctionDefinition.make(undefined, new Names([ Name.make() ]), undefined, [], new ExpressionPlaceholder()),
        StructureDefinition.make(undefined, new Names([ Name.make() ]), [], undefined, []),
        ConversionDefinition.make(undefined, new TypePlaceholder(), new TypePlaceholder(), new ExpressionPlaceholder()),
        new Reaction(new ExpressionPlaceholder(), new Token(STREAM_SYMBOL, TokenType.REACTION), new ExpressionPlaceholder()),
        Previous.make(new ExpressionPlaceholder(), new ExpressionPlaceholder())
    ].filter(expr => expr instanceof TypeVariable || type === undefined ? true : type.accepts(expr.getType(context), context))
}

export function getExpressionReplacements(parent: Node, child: Expression, context: Context, type?: Type): Replace<Expression>[] {

    return getPossibleExpressions(parent, child, context, type ?? new AnyType())
        .map(expr => new Replace(
                context, 
                child, 
                getPossibleReference(expr)
            )
        );

}

export function getExpressionInsertions(position: number, parent: Node, list: Node[], before: Node | undefined, context: Context, type?: Type): Append<Expression>[] {

    return getPossibleExpressions(parent, undefined, context, type)
        .map(expr => new Append(
                context,
                position,
                parent,
                list,
                before,
                getPossibleReference(expr)
            )
        );

}

function getPossibleReference(replacement: Expression | Definition): Expression | Refer<Expression> {
    return replacement instanceof Expression && !(replacement instanceof FunctionDefinition) && !(replacement instanceof StructureDefinition) ? 
        replacement : [ (name: string) => Reference.make(name), replacement ]

}

export function getPossiblePostfix(context: Context, node: Expression, type?: Type): Replace<Expression>[] {

    return [
        // If the type is a boolean, offer a conditional
        ...(type instanceof BooleanType ? [ new Replace(context, node, Conditional.make(node, new ExpressionPlaceholder(), new ExpressionPlaceholder())) ] : []),
        // If the type is a list, offer a list access
        ...(type instanceof ListType ? [ new Replace(context, node, ListAccess.make(node, new ExpressionPlaceholder())) ] : []),
        // If the type is a set or map, offer a list access
        ...(type instanceof SetType || type instanceof MapType ? [ new Replace(context, node, SetOrMapAccess.make(node, new ExpressionPlaceholder())) ] : []),
        // If the type is a stream, offer a previous
        ...(type instanceof StreamType ? [ new Replace(context, node, Previous.make(node, new ExpressionPlaceholder())) ] : []),
        // Reactions
        ...[ new Replace(context, node, new Reaction(node, new Token(STREAM_SYMBOL, TokenType.REACTION), new ExpressionPlaceholder()))],
        // If given a type, any binary operations that are available on the type.
        ...((type === undefined ? [] : type.getAllDefinitions(node, context).filter((def): def is FunctionDefinition => def instanceof FunctionDefinition && def.isOperator()) 
            .map(def => new Replace(context, node, [ () => new BinaryOperation(def.getOperatorName() as string, node, new ExpressionPlaceholder()), def ])))),
        // Get any conversions available
        ...(type === undefined ? [] :
                type.getAllConversions(context)
                    .filter(conversion => conversion.input instanceof Type && type.accepts(conversion.input, context))
                    .map(conversion => new Replace(context, node, new Convert(node, conversion.output.replace()))))

    ];

}