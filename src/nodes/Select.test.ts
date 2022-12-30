import { test } from 'vitest';
import { testConflict } from '../conflicts/TestUtilities';
import UnknownColumn from '../conflicts/UnknownColumn';
import ExpectedSelectName from '../conflicts/ExpectedSelectName';
import NonBooleanQuery from '../conflicts/NonBooleanQuery';
import NotATable from '../conflicts/NotATable';
import Select from './Select';

test('Test select conflicts', () => {
    testConflict(
        'table: ⎡one•#⎦\ntable ⎡? ⎡one⎦ 1 < 2',
        'table: 1\ntable ⎡? ⎡one⎦ 1 < 2',
        Select,
        NotATable
    );
    testConflict(
        'table: ⎡one•#⎦\ntable ⎡? ⎡one⎦ 1 < 2',
        'table: 1\ntable ⎡? ⎡one⎦ 1 + 2',
        Select,
        NonBooleanQuery
    );
    testConflict(
        'table: ⎡one•#⎦\ntable ⎡? ⎡one⎦ 1 < 2',
        'table: ⎡one•#⎦\ntable ⎡? ⎡two⎦ 1 < 2',
        Select,
        UnknownColumn
    );
    testConflict(
        'table: ⎡one•#⎦\ntable ⎡? ⎡one⎦ one < 1',
        'table: ⎡one•#⎦\ntable ⎡? ⎡1⎦ one < 1',
        Select,
        ExpectedSelectName
    );
});
