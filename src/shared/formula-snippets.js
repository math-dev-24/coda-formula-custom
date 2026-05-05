export const CODA_FORMULA_SNIPPETS = [
  {
    id: 'filter',
    name: 'Filter',
    signature: 'Table.Filter(condition)',
    snippet: 'Table.Filter(CurrentValue.Status = "Active")',
  },
  {
    id: 'withname',
    name: 'WithName',
    signature: 'value.WithName(name, formula)',
    snippet: 'List.Combine().WithName(items, items.Filter(CurrentValue.IsNotBlank()))',
  },
  {
    id: 'switchif',
    name: 'SwitchIf',
    signature: 'SwitchIf(condition, result, ...)',
    snippet: 'SwitchIf(\n  Condition1, Result1,\n  Condition2, Result2,\n  DefaultResult\n)',
  },
  {
    id: 'runactions',
    name: 'RunActions',
    signature: 'RunActions(action1, action2, ...)',
    snippet: 'RunActions(\n  ModifyRows(row, Column, Value),\n  Notify("Done")\n)',
  },
  {
    id: 'formula-map',
    name: 'FormulaMap',
    signature: 'List.FormulaMap(formula)',
    snippet: 'List.FormulaMap(CurrentValue.ToText())',
  },
];
