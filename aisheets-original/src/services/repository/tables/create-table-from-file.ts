import { connectAndClose } from '~/services/db/duckdb';
import { ColumnModel } from '~/services/db/models';
import type { Column, ColumnKind } from '~/state';
import {
  getColumnName,
  getDatasetRowSequenceName,
  getDatasetTableName,
} from './utils';

export const createDatasetTableFromFile = async (
  {
    dataset,
    file,
  }: {
    dataset: {
      id: string;
      name: string;
      createdBy: string;
    };
    file: string;
  },
  options?: {
    limit?: number;
    secrets?: {
      googleSheets?: string;
    };
  },
): Promise<Column[]> => {
  return await connectAndClose(async (db) => {
    const tableName = getDatasetTableName(dataset);
    const sequenceName = getDatasetRowSequenceName(dataset);

    let secretDropStatement = '';

    await db.run(`
      BEGIN TRANSACTION;
    `);

    if (options?.secrets?.googleSheets) {
      await db.run(`
        CREATE OR REPLACE SECRET gsheet_secret(
          TYPE gsheet,
          PROVIDER access_token, 
          TOKEN '${options.secrets.googleSheets}'
        );  
      `);

      secretDropStatement = 'DROP SECRET gsheet_secret;';
    }

    const results = await db.run(`
      DESCRIBE (SELECT * FROM '${file}');
    `);

    const columns = await results.getRowObjects();

    const dbColumns = await ColumnModel.bulkCreate(
      columns.map((column) => ({
        datasetId: dataset.id,
        name: column.column_name as string,
        type: column.column_type as string,
        kind: 'static',
      })),
    );

    const selectColumnNames = dbColumns
      .map((column) => `"${column.name}" as ${getColumnName(column)}`)
      .join(', ');

    let selectStatement = `SELECT ${selectColumnNames}, nextval('${sequenceName}') as rowIdx FROM '${file}'`;

    if (options?.limit) selectStatement += ` LIMIT ${options.limit}`;

    await db.run(`
      CREATE OR REPLACE SEQUENCE ${sequenceName} START 0 INCREMENT 1 MINVALUE 0;

      CREATE TABLE ${tableName} AS (${selectStatement});

      SHOW ${tableName};

      ${secretDropStatement}

      COMMIT;
    `);

    return dbColumns.map((column) => {
      return {
        id: column.id,
        name: column.name,
        type: column.type,
        kind: column.kind as ColumnKind,
        visible: column.visible,
        dataset,
        cells: [],
      };
    });
  });
};
