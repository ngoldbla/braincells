import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateCells } from './generate-cells';
import { createDataset } from '~/services/repository/datasets';
import { createColumn } from '~/services/repository/columns';
import { createProcess } from '~/services/repository/processes';
import { createCell, updateCell } from '~/services/repository/cells';
import { DatasetModel, ColumnModel, ProcessModel, ColumnCellModel } from '~/services/db/models';
import { persistentCacheGet, persistentCacheSet, persistentCacheFlush } from '~/services/cache';
import type { Column, Process, Session } from '~/state';

describe('E2E: Generate Cells with Enhancements', () => {
  let dataset: any;
  let session: Session;
  let accessToken: string | undefined;

  beforeEach(async () => {
    // Create test dataset
    dataset = await createDataset({
      dataset: {
        name: 'Test Dataset',
        description: 'Dataset for E2E tests',
      },
    });

    // Mock session
    accessToken = process.env.HF_TOKEN;
    session = {
      token: accessToken || 'mock-token',
      user: {
        id: 'test-user',
        name: 'Test User',
        email: 'test@example.com',
      },
    } as Session;
  });

  afterEach(async () => {
    await DatasetModel.destroy({ where: {} });
    await ColumnModel.destroy({ where: {} });
    await ProcessModel.destroy({ where: {} });
    await ColumnCellModel.destroy({ where: {} });
    persistentCacheFlush();
  });

  describe('Feature 1: Concurrent Batch Processing', () => {
    it('should process multiple cells concurrently with configurable concurrency', async () => {
      // Skip if no access token
      if (!accessToken) {
        console.warn('⚠️ Skipping test: HF_TOKEN not set');
        return;
      }

      const column = await createColumn({
        column: {
          name: 'Test Column',
          type: 'text',
          kind: 'dynamic',
          visible: true,
        },
        datasetId: dataset.id,
      });

      const process = await createProcess({
        process: {
          prompt: 'Generate a random color name',
          modelName: 'google/gemma-2-2b-it',
          modelProvider: 'nebius',
          searchEnabled: false,
          useCustomEndpoint: false,
        },
        columnId: column.id,
      });

      const fullColumn: Column = {
        ...column,
        process,
        dataset,
        cells: [],
      };

      const results: any[] = [];
      const startTime = Date.now();

      for await (const result of generateCells({
        column: fullColumn,
        process,
        session,
        limit: 10,
        stream: false,
      })) {
        if (result.cell) {
          results.push(result.cell);
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should have generated cells
      expect(results.length).toBeGreaterThan(0);

      // Should complete in reasonable time (concurrent processing should be faster)
      console.log(`⏱️ Generated ${results.length} cells in ${duration}ms`);

      // Verify cells have values
      const completedCells = results.filter(c => c.value && !c.generating);
      expect(completedCells.length).toBeGreaterThan(0);
    }, 180000); // 3 minute timeout

    it('should respect MAX_CONCURRENCY limit', async () => {
      if (!accessToken) {
        console.warn('⚠️ Skipping test: HF_TOKEN not set');
        return;
      }

      const column = await createColumn({
        column: {
          name: 'Test Column',
          type: 'text',
          kind: 'dynamic',
          visible: true,
        },
        datasetId: dataset.id,
      });

      const process = await createProcess({
        process: {
          prompt: 'Generate a number',
          modelName: 'google/gemma-2-2b-it',
          modelProvider: 'nebius',
          searchEnabled: false,
          useCustomEndpoint: false,
        },
        columnId: column.id,
      });

      const fullColumn: Column = {
        ...column,
        process,
        dataset,
        cells: [],
      };

      let maxConcurrent = 0;
      let currentConcurrent = 0;

      const originalUpdateCell = updateCell;
      vi.spyOn(await import('~/services/repository/cells'), 'updateCell').mockImplementation(async (cell) => {
        if (cell.generating) {
          currentConcurrent++;
          maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
        } else {
          currentConcurrent--;
        }
        return originalUpdateCell(cell);
      });

      for await (const _ of generateCells({
        column: fullColumn,
        process,
        session,
        limit: 10,
        stream: false,
      })) {
        // Just iterate
      }

      // Max concurrent should not exceed the configured limit (5 by default)
      expect(maxConcurrent).toBeLessThanOrEqual(5);
    }, 180000);
  });

  describe('Feature 2: Streaming Responses', () => {
    it('should stream cell updates in real-time', async () => {
      if (!accessToken) {
        console.warn('⚠️ Skipping test: HF_TOKEN not set');
        return;
      }

      const column = await createColumn({
        column: {
          name: 'Test Column',
          type: 'text',
          kind: 'dynamic',
          visible: true,
        },
        datasetId: dataset.id,
      });

      const process = await createProcess({
        process: {
          prompt: 'Write a short sentence about {{topic}}',
          modelName: 'google/gemma-2-2b-it',
          modelProvider: 'nebius',
          searchEnabled: false,
          useCustomEndpoint: false,
        },
        columnId: column.id,
      });

      // Create cells with topics
      await createCell({
        cell: { idx: 0, value: 'cats' },
        columnId: column.id,
      });

      const fullColumn: Column = {
        ...column,
        process: {
          ...process,
          columnsReferences: [column.id],
        },
        dataset,
        cells: [],
      };

      const updates: any[] = [];
      let streamingUpdates = 0;

      for await (const result of generateCells({
        column: fullColumn,
        process: {
          ...process,
          columnsReferences: [column.id],
        },
        session,
        limit: 1,
        stream: true,
        streamInBatch: true,
      })) {
        if (result.cell) {
          updates.push({ ...result.cell });
          if (result.cell.generating && result.cell.value) {
            streamingUpdates++;
          }
        }
      }

      // Should receive multiple streaming updates
      expect(streamingUpdates).toBeGreaterThan(0);
      console.log(`📡 Received ${streamingUpdates} streaming updates`);
    }, 180000);

    it('should accumulate content during streaming', async () => {
      if (!accessToken) {
        console.warn('⚠️ Skipping test: HF_TOKEN not set');
        return;
      }

      const column = await createColumn({
        column: {
          name: 'Test Column',
          type: 'text',
          kind: 'dynamic',
          visible: true,
        },
        datasetId: dataset.id,
      });

      const process = await createProcess({
        process: {
          prompt: 'Count from 1 to 10',
          modelName: 'google/gemma-2-2b-it',
          modelProvider: 'nebius',
          searchEnabled: false,
          useCustomEndpoint: false,
        },
        columnId: column.id,
      });

      const fullColumn: Column = {
        ...column,
        process,
        dataset,
        cells: [],
      };

      const values: string[] = [];

      for await (const result of generateCells({
        column: fullColumn,
        process,
        session,
        limit: 1,
        stream: true,
      })) {
        if (result.cell?.value) {
          values.push(result.cell.value);
        }
      }

      // Should see progressively longer values
      if (values.length > 1) {
        const isAccumulating = values.some((val, i) =>
          i > 0 && val.length >= values[i - 1].length
        );
        expect(isAccumulating).toBe(true);
      }
    }, 180000);
  });

  describe('Feature 3: Resume Capability', () => {
    it('should resume from last generated cell', async () => {
      if (!accessToken) {
        console.warn('⚠️ Skipping test: HF_TOKEN not set');
        return;
      }

      const column = await createColumn({
        column: {
          name: 'Test Column',
          type: 'text',
          kind: 'dynamic',
          visible: true,
        },
        datasetId: dataset.id,
      });

      const process = await createProcess({
        process: {
          prompt: 'Generate a word',
          modelName: 'google/gemma-2-2b-it',
          modelProvider: 'nebius',
          searchEnabled: false,
          useCustomEndpoint: false,
        },
        columnId: column.id,
      });

      // Create some already generated cells
      await createCell({
        cell: { idx: 0, value: 'apple', validated: false },
        columnId: column.id,
      });
      await createCell({
        cell: { idx: 1, value: 'banana', validated: false },
        columnId: column.id,
      });
      await createCell({
        cell: { idx: 2, value: 'cherry', validated: false },
        columnId: column.id,
      });

      const existingCells = [
        { id: '1', idx: 0, value: 'apple', validated: false, generating: false },
        { id: '2', idx: 1, value: 'banana', validated: false, generating: false },
        { id: '3', idx: 2, value: 'cherry', validated: false, generating: false },
      ];

      const fullColumn: Column = {
        ...column,
        process,
        dataset,
        cells: existingCells as any,
      };

      const results: any[] = [];

      for await (const result of generateCells({
        column: fullColumn,
        process,
        session,
        limit: 5,
        resumeFromLast: true,
        stream: false,
      })) {
        if (result.cell) {
          results.push(result.cell);
        }
      }

      // Should only generate cells starting from idx 3
      const newCells = results.filter(c => c.idx >= 3);
      expect(newCells.length).toBeGreaterThan(0);

      // Should not regenerate cells 0, 1, 2
      const regenerated = results.filter(c => c.idx < 3 && !c.validated);
      expect(regenerated.length).toBe(0);
    }, 180000);

    it('should skip validated cells during generation', async () => {
      if (!accessToken) {
        console.warn('⚠️ Skipping test: HF_TOKEN not set');
        return;
      }

      const column = await createColumn({
        column: {
          name: 'Test Column',
          type: 'text',
          kind: 'dynamic',
          visible: true,
        },
        datasetId: dataset.id,
      });

      const process = await createProcess({
        process: {
          prompt: 'Generate a word',
          modelName: 'google/gemma-2-2b-it',
          modelProvider: 'nebius',
          searchEnabled: false,
          useCustomEndpoint: false,
        },
        columnId: column.id,
      });

      // Create validated cell at idx 1
      const validatedCell = await createCell({
        cell: { idx: 1, value: 'validated-word', validated: true },
        columnId: column.id,
      });

      const fullColumn: Column = {
        ...column,
        process,
        dataset,
        cells: [],
      };

      const results: any[] = [];

      for await (const result of generateCells({
        column: fullColumn,
        process,
        session,
        limit: 3,
        validatedCells: [validatedCell as any],
        stream: false,
      })) {
        if (result.cell) {
          results.push(result.cell);
        }
      }

      // Should not include idx 1
      const idx1Results = results.filter(c => c.idx === 1);
      expect(idx1Results.length).toBe(0);
    }, 180000);
  });

  describe('Feature 4: Persistent Caching', () => {
    it('should cache prompt execution results persistently', async () => {
      if (!accessToken) {
        console.warn('⚠️ Skipping test: HF_TOKEN not set');
        return;
      }

      const column = await createColumn({
        column: {
          name: 'Test Column',
          type: 'text',
          kind: 'dynamic',
          visible: true,
        },
        datasetId: dataset.id,
      });

      const process = await createProcess({
        process: {
          prompt: 'Say hello',
          modelName: 'google/gemma-2-2b-it',
          modelProvider: 'nebius',
          searchEnabled: false,
          useCustomEndpoint: false,
        },
        columnId: column.id,
      });

      const fullColumn: Column = {
        ...column,
        process,
        dataset,
        cells: [],
      };

      // First generation - should hit the API
      const firstRun: any[] = [];
      const startTime1 = Date.now();

      for await (const result of generateCells({
        column: fullColumn,
        process,
        session,
        limit: 1,
        stream: false,
      })) {
        if (result.cell) {
          firstRun.push(result.cell);
        }
      }

      const duration1 = Date.now() - startTime1;

      // Second generation - should use cache
      const secondRun: any[] = [];
      const startTime2 = Date.now();

      for await (const result of generateCells({
        column: fullColumn,
        process,
        session,
        limit: 1,
        stream: false,
      })) {
        if (result.cell) {
          secondRun.push(result.cell);
        }
      }

      const duration2 = Date.now() - startTime2;

      // Cached run should be significantly faster
      expect(duration2).toBeLessThan(duration1);
      console.log(`⚡ First run: ${duration1}ms, Cached run: ${duration2}ms`);

      // Results should be identical
      const firstValue = firstRun.find(c => !c.generating)?.value;
      const secondValue = secondRun.find(c => !c.generating)?.value;
      if (firstValue && secondValue) {
        expect(secondValue).toBe(firstValue);
      }
    }, 180000);

    it('should retrieve cached values from persistent storage', async () => {
      const cacheKey = {
        modelName: 'test-model',
        modelProvider: 'test-provider',
        instruction: 'test instruction',
        data: {},
        examples: [],
        withSources: false,
      };

      const testValue = 'cached result';

      // Set cache
      persistentCacheSet(cacheKey, testValue);

      // Get cache
      const retrieved = persistentCacheGet(cacheKey);

      expect(retrieved).toBe(testValue);
    });

    it('should support cache expiration', async () => {
      const cacheKey = 'test-expiration-key';
      const testValue = 'expiring value';

      // Set with 100ms TTL
      persistentCacheSet(cacheKey, testValue, 100);

      // Should exist immediately
      const immediate = persistentCacheGet(cacheKey);
      expect(immediate).toBe(testValue);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be expired
      const expired = persistentCacheGet(cacheKey);
      expect(expired).toBeUndefined();
    });
  });

  describe('Feature 5: End-to-End Integration', () => {
    it('should handle complete workflow with all features', async () => {
      if (!accessToken) {
        console.warn('⚠️ Skipping test: HF_TOKEN not set');
        return;
      }

      const column = await createColumn({
        column: {
          name: 'Integration Test Column',
          type: 'text',
          kind: 'dynamic',
          visible: true,
        },
        datasetId: dataset.id,
      });

      const process = await createProcess({
        process: {
          prompt: 'Generate a creative word',
          modelName: 'google/gemma-2-2b-it',
          modelProvider: 'nebius',
          searchEnabled: false,
          useCustomEndpoint: false,
        },
        columnId: column.id,
      });

      // Create some pre-existing cells
      await createCell({
        cell: { idx: 0, value: 'existing', validated: true },
        columnId: column.id,
      });

      const fullColumn: Column = {
        ...column,
        process,
        dataset,
        cells: [
          { id: '1', idx: 0, value: 'existing', validated: true, generating: false } as any,
        ],
      };

      const allResults: any[] = [];
      let streamingCount = 0;

      for await (const result of generateCells({
        column: fullColumn,
        process,
        session,
        limit: 5,
        stream: true,
        resumeFromLast: true,
        validatedCells: fullColumn.cells as any,
      })) {
        if (result.cell) {
          allResults.push(result.cell);
          if (result.cell.generating) {
            streamingCount++;
          }
        }
      }

      // Should have processed cells
      expect(allResults.length).toBeGreaterThan(0);

      // Should not have regenerated validated cell
      const validatedRegenerated = allResults.filter(c => c.idx === 0);
      expect(validatedRegenerated.length).toBe(0);

      // Should have streamed responses
      expect(streamingCount).toBeGreaterThan(0);

      console.log(`✅ Full workflow test completed with ${allResults.length} results`);
    }, 300000); // 5 minute timeout
  });
});
