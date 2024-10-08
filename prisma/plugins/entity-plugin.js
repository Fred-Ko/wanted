"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.name = void 0;
exports.default = run;
var ast_1 = require("@zenstackhq/sdk/ast");
var fs = require("fs/promises");
var path = require("path");
exports.name = 'entity';
var generateHeader = function (importPath, currentModelName) { return "/////////////////////////////////////////////////////////////////////////////////////////////////\n// DO NOT MODIFY THIS FILE                                                                     //\n// This file is automatically generated by ZenStack Plugin and should not be manually updated. //\n/////////////////////////////////////////////////////////////////////////////////////////////////\n\nimport { Type } from 'class-transformer';\n".concat(importPath ? "import { ".concat(importPath, " } from './index';\n") : '', "\n"); };
var hasAttribute = function (attributes, attributeName) { return (attributes === null || attributes === void 0 ? void 0 : attributes.includes(attributeName)) || false; };
var getInterfaceName = function (dataModel) {
    var _a;
    var attributes = (_a = dataModel.attributes) === null || _a === void 0 ? void 0 : _a.map(function (attr) { var _a; return (_a = attr.decl.ref) === null || _a === void 0 ? void 0 : _a.name; });
    if (hasAttribute(attributes, '@@Entity'))
        return "".concat(dataModel.name, "Entity");
    if (hasAttribute(attributes, '@@ValueObject'))
        return "".concat(dataModel.name, "VO");
    return '';
};
var mysqlToTsTypeMap = {
    VARCHAR: 'string',
    CHAR: 'string',
    TEXT: 'string',
    INT: 'number',
    INTEGER: 'number',
    TINYINT: 'number',
    SMALLINT: 'number',
    MEDIUMINT: 'number',
    BIGINT: 'string',
    FLOAT: 'number',
    DOUBLE: 'number',
    DECIMAL: 'number',
    DATE: 'string',
    DATETIME: 'Date',
    TIMESTAMP: 'string',
    TIME: 'string',
    YEAR: 'number',
    BOOLEAN: 'boolean',
    STRING: 'string',
    JSON: 'any',
};
var getFieldType = function (field) { var _a, _b; return ((_b = (_a = field.type.reference) === null || _a === void 0 ? void 0 : _a.ref) === null || _b === void 0 ? void 0 : _b.name) || field.type.type.toLowerCase(); };
var getRelatedModel = function (fieldType, model) {
    return model.declarations.find(function (decl) { return decl.name === fieldType && (0, ast_1.isDataModel)(decl); });
};
var getRelatedType = function (relatedModel) {
    var _a;
    var attributes = (_a = relatedModel.attributes) === null || _a === void 0 ? void 0 : _a.map(function (attr) { var _a; return (_a = attr.decl.ref) === null || _a === void 0 ? void 0 : _a.name; });
    if (hasAttribute(attributes, '@@Entity'))
        return "".concat(relatedModel.name, "Entity");
    if (hasAttribute(attributes, '@@ValueObject'))
        return "".concat(relatedModel.name, "VO");
    return '';
};
var mapFieldType = function (field, model) {
    var fieldType = getFieldType(field);
    var mappedType = '';
    if (field.type.reference) {
        var relatedModel = getRelatedModel(fieldType, model);
        if (relatedModel) {
            var relatedType = getRelatedType(relatedModel);
            mappedType = field.type.array ? "".concat(relatedType, "[]") : relatedType;
        }
    }
    else {
        mappedType = mysqlToTsTypeMap[fieldType.toUpperCase()] || fieldType;
        mappedType = field.type.array ? "".concat(mappedType, "[]") : mappedType;
    }
    // 옵셔널 필드 처리
    var types = [mappedType];
    return types;
};
var isNonVORelation = function (field, model) {
    var _a, _b, _c;
    var fieldType = (_b = (_a = field.type.reference) === null || _a === void 0 ? void 0 : _a.ref) === null || _b === void 0 ? void 0 : _b.name;
    if (!fieldType)
        return false;
    var relatedModel = getRelatedModel(fieldType, model);
    if (!relatedModel)
        return false;
    var attributes = (_c = relatedModel.attributes) === null || _c === void 0 ? void 0 : _c.map(function (attr) { var _a; return (_a = attr.decl.ref) === null || _a === void 0 ? void 0 : _a.name; });
    return hasAttribute(attributes, '@@Entity');
};
var isRelationField = function (field) { return !!field.type.reference; };
var generateFieldDeclaration = function (field, model, isVO) {
    var _a, _b, _c;
    if (isVO && isRelationField(field)) {
        return '';
    }
    var fieldType = mapFieldType(field, model);
    var isRelation = isRelationField(field);
    var relatedModel = isRelation ? getRelatedModel((_b = (_a = field.type.reference) === null || _a === void 0 ? void 0 : _a.ref) === null || _b === void 0 ? void 0 : _b.name, model) : null;
    var isRelatedVO = relatedModel
        ? hasAttribute((_c = relatedModel.attributes) === null || _c === void 0 ? void 0 : _c.map(function (attr) { var _a; return (_a = attr.decl.ref) === null || _a === void 0 ? void 0 : _a.name; }), '@@ValueObject')
        : false;
    var optionalMark = field.type.optional || (isRelation && !isRelatedVO) ? '?' : '';
    var typeDecorator = isRelation ? "  @Type(() => ".concat(fieldType[0], ")\n").replace('[]', '') : '';
    return "".concat(typeDecorator, "  public readonly ").concat(field.name).concat(optionalMark, ": ").concat(fieldType.join(' | '), ";");
};
var generateClassContent = function (dataModel, model, isVO) {
    var interfaceName = getInterfaceName(dataModel);
    var sortFields = function (a, b) {
        var aIsOptional = a.type.optional || (isRelationField(a) && !isVORelation(a, model));
        var bIsOptional = b.type.optional || (isRelationField(b) && !isVORelation(b, model));
        if (aIsOptional === bIsOptional)
            return 0;
        if (aIsOptional)
            return 1;
        return -1;
    };
    var fields = dataModel.fields.filter(function (field) { return !(isVO && field.name === 'id'); }).sort(sortFields);
    var fieldDeclarations = fields
        .map(function (field) { return generateFieldDeclaration(field, model, isVO); })
        .filter(function (declaration) { return declaration !== ''; })
        .join('\n');
    return "export class ".concat(interfaceName, " {\n").concat(fieldDeclarations, "\n}\n\n");
};
var isVORelation = function (field, model) {
    var _a, _b, _c;
    var fieldType = (_b = (_a = field.type.reference) === null || _a === void 0 ? void 0 : _a.ref) === null || _b === void 0 ? void 0 : _b.name;
    if (!fieldType)
        return false;
    var relatedModel = getRelatedModel(fieldType, model);
    if (!relatedModel)
        return false;
    var attributes = (_c = relatedModel.attributes) === null || _c === void 0 ? void 0 : _c.map(function (attr) { var _a; return (_a = attr.decl.ref) === null || _a === void 0 ? void 0 : _a.name; });
    return hasAttribute(attributes, '@@ValueObject');
};
var generateModelContent = function (dataModel, model) {
    var interfaceName = getInterfaceName(dataModel);
    var isVO = interfaceName.endsWith('VO');
    if (!interfaceName)
        return '';
    return generateClassContent(dataModel, model, isVO);
};
var writeToFile = function (content, outputDir, fileName) { return __awaiter(void 0, void 0, void 0, function () {
    var outputPath;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                outputPath = path.join(outputDir, "".concat(fileName, ".ts"));
                return [4 /*yield*/, fs.mkdir(path.dirname(outputPath), { recursive: true })];
            case 1:
                _a.sent();
                return [4 /*yield*/, fs.writeFile(outputPath, content)];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var generateIndexContent = function (interfaceNames) {
    return interfaceNames.map(function (name) { return "export * from './".concat(name, "';"); }).join('\n') + '\n';
};
function run(model, options) {
    return __awaiter(this, void 0, void 0, function () {
        var dataModels, outputDir, interfaceNames, _loop_1, _i, dataModels_1, dataModel, indexContent;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dataModels = model.declarations.filter(ast_1.isDataModel);
                    outputDir = options.outputDir;
                    if (!outputDir) {
                        throw new Error('outputDir is not set');
                    }
                    interfaceNames = [];
                    _loop_1 = function (dataModel) {
                        var interfaceName, importPaths_1, importPath, content;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    interfaceName = getInterfaceName(dataModel);
                                    if (!interfaceName) return [3 /*break*/, 2];
                                    interfaceNames.push(interfaceName);
                                    importPaths_1 = new Set();
                                    // 관련 모델의 임포트 경로 수집
                                    dataModel.fields.forEach(function (field) {
                                        var _a;
                                        if (field.type.reference) {
                                            var relatedModel = getRelatedModel((_a = field.type.reference.ref) === null || _a === void 0 ? void 0 : _a.name, model);
                                            if (relatedModel) {
                                                var relatedType = getRelatedType(relatedModel);
                                                if (relatedType && relatedType !== interfaceName) {
                                                    importPaths_1.add(relatedType);
                                                }
                                            }
                                        }
                                    });
                                    importPath = Array.from(importPaths_1).join(', ');
                                    content = generateHeader(importPath, interfaceName) + generateModelContent(dataModel, model);
                                    return [4 /*yield*/, writeToFile(content, outputDir, interfaceName)];
                                case 1:
                                    _b.sent();
                                    _b.label = 2;
                                case 2: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, dataModels_1 = dataModels;
                    _a.label = 1;
                case 1:
                    if (!(_i < dataModels_1.length)) return [3 /*break*/, 4];
                    dataModel = dataModels_1[_i];
                    return [5 /*yield**/, _loop_1(dataModel)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    indexContent = generateIndexContent(interfaceNames);
                    return [4 /*yield*/, writeToFile(indexContent, outputDir, 'index')];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
