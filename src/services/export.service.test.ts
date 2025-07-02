import { Test, TestingModule } from '@nestjs/testing';
import { ExportService } from './export.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs');
jest.mock('path');

describe('ExportService', () => {
  let service: ExportService;
  let configService: ConfigService;
  let logger: Logger;

  const mockConfigService = {
    get: jest.fn(),
    getOrThrow: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<ExportService>(ExportService);
    configService = module.get<ConfigService>(ConfigService);
    logger = module.get<Logger>(Logger);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with config service and logger', () => {
      expect(configService).toBeDefined();
      expect(logger).toBeDefined();
    });
  });

  describe('exportToCSV', () => {
    const mockData = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    ];

    beforeEach(() => {
      mockConfigService.get.mockReturnValue('/tmp/exports');
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
      (path.join as jest.Mock).mockReturnValue('/tmp/exports/test.csv');
    });

    it('should export data to CSV successfully', async () => {
      const result = await service.exportToCSV(mockData, 'test.csv');

      expect(result).toEqual({
        success: true,
        filePath: '/tmp/exports/test.csv',
        recordCount: 2,
      });
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    });

    it('should handle empty data array', async () => {
      const result = await service.exportToCSV([], 'empty.csv');

      expect(result).toEqual({
        success: true,
        filePath: '/tmp/exports/empty.csv',
        recordCount: 0,
      });
    });

    it('should throw error when filename is not provided', async () => {
      await expect(service.exportToCSV(mockData, '')).rejects.toThrow(
        'Filename is required',
      );
    });

    it('should throw error when filename is null', async () => {
      await expect(service.exportToCSV(mockData, null as any)).rejects.toThrow(
        'Filename is required',
      );
    });

    it('should handle data with special characters in CSV', async () => {
      const specialData = [
        { id: 1, name: 'John "Johnny" Doe', description: 'Line 1\nLine 2' },
      ];

      const result = await service.exportToCSV(specialData, 'special.csv');

      expect(result.success).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"John ""Johnny"" Doe"'),
      );
    });

    it('should handle data with undefined/null values', async () => {
      const dataWithNulls = [
        { id: 1, name: 'John', email: null, age: undefined },
      ];

      const result = await service.exportToCSV(dataWithNulls, 'nulls.csv');

      expect(result.success).toBe(true);
    });

    it('should create export directory if it does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {});

      await service.exportToCSV(mockData, 'test.csv');

      expect(fs.mkdirSync).toHaveBeenCalledWith('/tmp/exports', {
        recursive: true,
      });
    });

    it('should handle file write errors', async () => {
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Write permission denied');
      });

      await expect(service.exportToCSV(mockData, 'test.csv')).rejects.toThrow(
        'Write permission denied',
      );
    });

    it('should handle very large datasets', async () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
      }));

      const result = await service.exportToCSV(largeData, 'large.csv');

      expect(result.success).toBe(true);
      expect(result.recordCount).toBe(10000);
    });

    it('should handle data with inconsistent object keys', async () => {
      const inconsistentData = [
        { id: 1, name: 'John', email: 'john@example.com' },
        { id: 2, name: 'Jane', phone: '123-456-7890' },
        { id: 3, address: '123 Main St' },
      ];

      const result = await service.exportToCSV(inconsistentData, 'inconsistent.csv');

      expect(result.success).toBe(true);
    });
  });

  describe('exportToJSON', () => {
    const mockData = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    ];

    beforeEach(() => {
      mockConfigService.get.mockReturnValue('/tmp/exports');
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
      (path.join as jest.Mock).mockReturnValue('/tmp/exports/test.json');
    });

    it('should export data to JSON successfully', async () => {
      const result = await service.exportToJSON(mockData, 'test.json');

      expect(result).toEqual({
        success: true,
        filePath: '/tmp/exports/test.json',
        recordCount: 2,
      });
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/tmp/exports/test.json',
        JSON.stringify(mockData, null, 2),
      );
    });

    it('should handle empty data array for JSON export', async () => {
      const result = await service.exportToJSON([], 'empty.json');

      expect(result.success).toBe(true);
      expect(result.recordCount).toBe(0);
    });

    it('should handle complex nested objects', async () => {
      const complexData = [
        {
          id: 1,
          user: {
            name: 'John',
            profile: {
              age: 30,
              skills: ['JavaScript', 'TypeScript'],
            },
          },
          metadata: {
            created: new Date('2023-01-01'),
            tags: ['developer', 'senior'],
          },
        },
      ];

      const result = await service.exportToJSON(complexData, 'complex.json');

      expect(result.success).toBe(true);
    });

    it('should handle circular references safely', async () => {
      const circularData: any = { id: 1, name: 'John' };
      circularData.self = circularData;

      await expect(service.exportToJSON([circularData], 'circular.json')).rejects.toThrow();
    });
  });

  describe('exportToXML', () => {
    const mockData = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    ];

    beforeEach(() => {
      mockConfigService.get.mockReturnValue('/tmp/exports');
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
      (path.join as jest.Mock).mockReturnValue('/tmp/exports/test.xml');
    });

    it('should export data to XML successfully', async () => {
      const result = await service.exportToXML(mockData, 'test.xml');

      expect(result.success).toBe(true);
      expect(result.recordCount).toBe(2);
    });

    it('should handle special characters in XML', async () => {
      const xmlData = [
        { id: 1, name: 'John & Jane', description: '<script>alert("test")</script>' },
      ];

      const result = await service.exportToXML(xmlData, 'special.xml');

      expect(result.success).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('&amp;'),
      );
    });

    it('should handle empty data for XML export', async () => {
      const result = await service.exportToXML([], 'empty.xml');

      expect(result.success).toBe(true);
      expect(result.recordCount).toBe(0);
    });
  });

  describe('getExportPath', () => {
    it('should return correct export path', () => {
      mockConfigService.get.mockReturnValue('/custom/exports');
      (path.join as jest.Mock).mockReturnValue('/custom/exports/test.csv');

      const result = service.getExportPath('test.csv');

      expect(result).toBe('/custom/exports/test.csv');
      expect(path.join).toHaveBeenCalledWith('/custom/exports', 'test.csv');
    });

    it('should use default path when config is not available', () => {
      mockConfigService.get.mockReturnValue(undefined);
      (path.join as jest.Mock).mockReturnValue('./exports/test.csv');

      const result = service.getExportPath('test.csv');

      expect(result).toBe('./exports/test.csv');
    });
  });

  describe('validateExportData', () => {
    it('should validate correct data structure', () => {
      const validData = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ];

      expect(() => service.validateExportData(validData)).not.toThrow();
    });

    it('should throw error for null data', () => {
      expect(() => service.validateExportData(null as any)).toThrow(
        'Export data must be an array',
      );
    });

    it('should throw error for undefined data', () => {
      expect(() => service.validateExportData(undefined as any)).toThrow(
        'Export data must be an array',
      );
    });

    it('should throw error for non-array data', () => {
      expect(() => service.validateExportData('not an array' as any)).toThrow(
        'Export data must be an array',
      );
    });

    it('should handle array with mixed data types', () => {
      const mixedData = [
        { id: 1, name: 'John' },
        'string item',
        123,
        null,
      ];

      expect(() => service.validateExportData(mixedData)).not.toThrow();
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(service.formatFileSize(0)).toBe('0 B');
      expect(service.formatFileSize(1023)).toBe('1023 B');
      expect(service.formatFileSize(1024)).toBe('1.0 KB');
      expect(service.formatFileSize(1048576)).toBe('1.0 MB');
      expect(service.formatFileSize(1073741824)).toBe('1.0 GB');
    });

    it('should handle negative values', () => {
      expect(service.formatFileSize(-1024)).toBe('0 B');
    });

    it('should handle very large numbers', () => {
      const largeNumber = Number.MAX_SAFE_INTEGER;
      expect(service.formatFileSize(largeNumber)).toMatch(/\d+\.?\d* [KMGT]B/);
    });
  });

  describe('cleanupOldExports', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue('/tmp/exports');
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        'old1.csv',
        'old2.json',
        'recent.xml',
      ]);
      (fs.statSync as jest.Mock).mockImplementation((filePath) => ({
        mtime: filePath.includes('old') 
          ? new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days old
          : new Date(), // recent
      }));
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {});
    });

    it('should cleanup old export files successfully', async () => {
      const result = await service.cleanupOldExports(7); // older than 7 days

      expect(result.deletedCount).toBe(2);
      expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
    });

    it('should handle cleanup when export directory does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = await service.cleanupOldExports(7);

      expect(result.deletedCount).toBe(0);
    });

    it('should handle file deletion errors gracefully', async () => {
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = await service.cleanupOldExports(7);

      expect(result.deletedCount).toBe(0);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should not delete files newer than specified days', async () => {
      const result = await service.cleanupOldExports(10); // older than 10 days

      expect(result.deletedCount).toBe(0);
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
  });

  describe('getExportStats', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue('/tmp/exports');
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        'file1.csv',
        'file2.json',
        'file3.xml',
      ]);
      (fs.statSync as jest.Mock).mockReturnValue({
        size: 1024,
        mtime: new Date(),
      });
    });

    it('should return correct export statistics', async () => {
      const stats = await service.getExportStats();

      expect(stats).toEqual({
        totalFiles: 3,
        totalSize: 3072,
        formattedSize: '3.0 KB',
        fileTypes: {
          csv: 1,
          json: 1,
          xml: 1,
        },
      });
    });

    it('should handle empty export directory', async () => {
      (fs.readdirSync as jest.Mock).mockReturnValue([]);

      const stats = await service.getExportStats();

      expect(stats.totalFiles).toBe(0);
      expect(stats.totalSize).toBe(0);
    });

    it('should handle missing export directory', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const stats = await service.getExportStats();

      expect(stats.totalFiles).toBe(0);
      expect(stats.totalSize).toBe(0);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle configuration service errors', async () => {
      mockConfigService.get.mockImplementation(() => {
        throw new Error('Config service error');
      });

      await expect(service.exportToCSV([], 'test.csv')).rejects.toThrow();
    });

    it('should handle logger errors gracefully', async () => {
      mockLogger.error.mockImplementation(() => {
        throw new Error('Logger error');
      });

      // Should not throw even if logger fails
      await expect(service.exportToCSV([], 'test.csv')).resolves.toBeDefined();
    });

    it('should handle concurrent export operations', async () => {
      const data = [{ id: 1, name: 'Test' }];
      
      const promises = [
        service.exportToCSV(data, 'concurrent1.csv'),
        service.exportToJSON(data, 'concurrent2.json'),
        service.exportToXML(data, 'concurrent3.xml'),
      ];

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('should handle memory pressure with large datasets', async () => {
      // Create a very large dataset to test memory handling
      const hugeData = Array.from({ length: 100000 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        description: 'A'.repeat(1000), // 1KB per record
        metadata: {
          created: new Date(),
          tags: Array.from({ length: 10 }, (_, j) => `tag${j}`),
        },
      }));

      const result = await service.exportToJSON(hugeData, 'huge.json');

      expect(result.success).toBe(true);
      expect(result.recordCount).toBe(100000);
    });
  });

  describe('integration scenarios', () => {
    it('should handle full export workflow', async () => {
      const testData = [
        { id: 1, name: 'John', email: 'john@test.com' },
        { id: 2, name: 'Jane', email: 'jane@test.com' },
      ];

      // Export to multiple formats
      const csvResult = await service.exportToCSV(testData, 'workflow.csv');
      const jsonResult = await service.exportToJSON(testData, 'workflow.json');
      const xmlResult = await service.exportToXML(testData, 'workflow.xml');

      // Verify all exports succeeded
      expect(csvResult.success).toBe(true);
      expect(jsonResult.success).toBe(true);
      expect(xmlResult.success).toBe(true);

      // Get stats and verify files are tracked
      const stats = await service.getExportStats();
      expect(stats.totalFiles).toBeGreaterThan(0);

      // Cleanup old files
      const cleanupResult = await service.cleanupOldExports(0);
      expect(cleanupResult).toBeDefined();
    });

    it('should maintain data integrity across export formats', async () => {
      const originalData = [
        {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          metadata: {
            created: '2023-01-01T00:00:00Z',
            active: true,
            score: 95.5,
          },
        },
      ];

      await service.exportToJSON(originalData, 'integrity.json');
      
      // Verify the written data maintains original structure
      const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
      const writtenData = JSON.parse(writeCall[1]);
      
      expect(writtenData).toEqual(originalData);
    });
  });
});