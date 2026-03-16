export namespace app {
	
	export class Capabilities {
	    hasTts: boolean;
	    hasImages: boolean;
	    hasAi: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Capabilities(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.hasTts = source["hasTts"];
	        this.hasImages = source["hasImages"];
	        this.hasAi = source["hasAi"];
	    }
	}
	export class ImageCacheInfo {
	    fileCount: number;
	    totalSize: number;
	
	    static createFrom(source: any = {}) {
	        return new ImageCacheInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.fileCount = source["fileCount"];
	        this.totalSize = source["totalSize"];
	    }
	}
	export class TTSCacheInfo {
	    fileCount: number;
	    totalSize: number;
	
	    static createFrom(source: any = {}) {
	        return new TTSCacheInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.fileCount = source["fileCount"];
	        this.totalSize = source["totalSize"];
	    }
	}

}

export namespace config {
	
	export class Field {
	    key: string;
	    label: string;
	    type: string;
	    options?: string[];
	
	    static createFrom(source: any = {}) {
	        return new Field(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.key = source["key"];
	        this.label = source["label"];
	        this.type = source["type"];
	        this.options = source["options"];
	    }
	}
	export class EntityType {
	    slug: string;
	    displayName: string;
	    icon: string;
	    fields: Field[];
	    listColumns?: string[];
	
	    static createFrom(source: any = {}) {
	        return new EntityType(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.slug = source["slug"];
	        this.displayName = source["displayName"];
	        this.icon = source["icon"];
	        this.fields = this.convertValues(source["fields"], Field);
	        this.listColumns = source["listColumns"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class AppConfig {
	    appName: string;
	    version: string;
	    entityTypes: EntityType[];
	
	    static createFrom(source: any = {}) {
	        return new AppConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.appName = source["appName"];
	        this.version = source["version"];
	        this.entityTypes = this.convertValues(source["entityTypes"], EntityType);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	

}

export namespace db {
	
	export class DB {
	
	
	    static createFrom(source: any = {}) {
	        return new DB(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	
	    }
	}
	export class DashboardStats {
	    totalEntities: number;
	    totalLinks: number;
	    quoteCount: number;
	    citedCount: number;
	    writerCount: number;
	    poetCount: number;
	    titleCount: number;
	    wordCount: number;
	    errorCount: number;
	
	    static createFrom(source: any = {}) {
	        return new DashboardStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.totalEntities = source["totalEntities"];
	        this.totalLinks = source["totalLinks"];
	        this.quoteCount = source["quoteCount"];
	        this.citedCount = source["citedCount"];
	        this.writerCount = source["writerCount"];
	        this.poetCount = source["poetCount"];
	        this.titleCount = source["titleCount"];
	        this.wordCount = source["wordCount"];
	        this.errorCount = source["errorCount"];
	    }
	}
	export class Entity {
	    id: number;
	    typeSlug: string;
	    primaryLabel: string;
	    secondaryLabel?: string;
	    description?: string;
	    attributes: Record<string, any>;
	    createdAt: Date;
	    updatedAt: Date;
	
	    static createFrom(source: any = {}) {
	        return new Entity(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.typeSlug = source["typeSlug"];
	        this.primaryLabel = source["primaryLabel"];
	        this.secondaryLabel = source["secondaryLabel"];
	        this.description = source["description"];
	        this.attributes = source["attributes"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	}
	export class Relationship {
	    id: number;
	    sourceId: number;
	    targetId: number;
	    label: string;
	    createdAt: Date;
	
	    static createFrom(source: any = {}) {
	        return new Relationship(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.sourceId = source["sourceId"];
	        this.targetId = source["targetId"];
	        this.label = source["label"];
	        this.createdAt = source["createdAt"];
	    }
	}
	export class Source {
	    sourceId: number;
	    title: string;
	    author?: string;
	    notes?: string;
	    createdAt: Date;
	
	    static createFrom(source: any = {}) {
	        return new Source(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.sourceId = source["sourceId"];
	        this.title = source["title"];
	        this.author = source["author"];
	        this.notes = source["notes"];
	        this.createdAt = source["createdAt"];
	    }
	}

}

export namespace services {
	
	export class DanglingRelationshipResult {
	    relationshipId: number;
	    sourceId: number;
	    targetId: number;
	    label: string;
	    sourceLabel: string;
	    sourceType: string;
	    missingSide: string;
	
	    static createFrom(source: any = {}) {
	        return new DanglingRelationshipResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.relationshipId = source["relationshipId"];
	        this.sourceId = source["sourceId"];
	        this.targetId = source["targetId"];
	        this.label = source["label"];
	        this.sourceLabel = source["sourceLabel"];
	        this.sourceType = source["sourceType"];
	        this.missingSide = source["missingSide"];
	    }
	}
	export class DuplicateEntityDetail {
	    id: number;
	    primaryLabel: string;
	    typeSlug: string;
	
	    static createFrom(source: any = {}) {
	        return new DuplicateEntityDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.primaryLabel = source["primaryLabel"];
	        this.typeSlug = source["typeSlug"];
	    }
	}
	export class DuplicateEntityResult {
	    strippedLabel: string;
	    original: DuplicateEntityDetail;
	    duplicates: DuplicateEntityDetail[];
	    count: number;
	
	    static createFrom(source: any = {}) {
	        return new DuplicateEntityResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.strippedLabel = source["strippedLabel"];
	        this.original = this.convertValues(source["original"], DuplicateEntityDetail);
	        this.duplicates = this.convertValues(source["duplicates"], DuplicateEntityDetail);
	        this.count = source["count"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class EntityService {
	
	
	    static createFrom(source: any = {}) {
	        return new EntityService(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	
	    }
	}
	export class EntityWithUnknownTypeResult {
	    id: number;
	    primaryLabel: string;
	    typeSlug: string;
	    incomingLinkCount: number;
	    singleIncomingLinkId?: number;
	    singleIncomingLinkLabel?: string;
	
	    static createFrom(source: any = {}) {
	        return new EntityWithUnknownTypeResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.primaryLabel = source["primaryLabel"];
	        this.typeSlug = source["typeSlug"];
	        this.incomingLinkCount = source["incomingLinkCount"];
	        this.singleIncomingLinkId = source["singleIncomingLinkId"];
	        this.singleIncomingLinkLabel = source["singleIncomingLinkLabel"];
	    }
	}
	export class EntityWithoutDescriptionResult {
	    id: number;
	    primaryLabel: string;
	    typeSlug: string;
	    hasMissingData: boolean;
	    singleIncomingLinkId?: number;
	    singleIncomingLinkLabel?: string;
	
	    static createFrom(source: any = {}) {
	        return new EntityWithoutDescriptionResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.primaryLabel = source["primaryLabel"];
	        this.typeSlug = source["typeSlug"];
	        this.hasMissingData = source["hasMissingData"];
	        this.singleIncomingLinkId = source["singleIncomingLinkId"];
	        this.singleIncomingLinkLabel = source["singleIncomingLinkLabel"];
	    }
	}
	export class GraphData {
	    nodes: db.Entity[];
	    edges: db.Relationship[];
	
	    static createFrom(source: any = {}) {
	        return new GraphData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.nodes = this.convertValues(source["nodes"], db.Entity);
	        this.edges = this.convertValues(source["edges"], db.Relationship);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ImageService {
	
	
	    static createFrom(source: any = {}) {
	        return new ImageService(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	
	    }
	}
	export class MissingReferenceDetail {
	    label: string;
	    relationshipId: number;
	
	    static createFrom(source: any = {}) {
	        return new MissingReferenceDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.label = source["label"];
	        this.relationshipId = source["relationshipId"];
	    }
	}
	export class LinkedEntityNotInDescriptionResult {
	    id: number;
	    primaryLabel: string;
	    typeSlug: string;
	    missingReferences: MissingReferenceDetail[];
	
	    static createFrom(source: any = {}) {
	        return new LinkedEntityNotInDescriptionResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.primaryLabel = source["primaryLabel"];
	        this.typeSlug = source["typeSlug"];
	        this.missingReferences = this.convertValues(source["missingReferences"], MissingReferenceDetail);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class OrphanedEntityResult {
	    id: number;
	    primaryLabel: string;
	    typeSlug: string;
	
	    static createFrom(source: any = {}) {
	        return new OrphanedEntityResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.primaryLabel = source["primaryLabel"];
	        this.typeSlug = source["typeSlug"];
	    }
	}
	export class RelationshipDetail {
	    id: number;
	    sourceId: number;
	    targetId: number;
	    label: string;
	    otherEntityId: number;
	    otherEntityLabel: string;
	    otherEntityType: string;
	
	    static createFrom(source: any = {}) {
	        return new RelationshipDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.sourceId = source["sourceId"];
	        this.targetId = source["targetId"];
	        this.label = source["label"];
	        this.otherEntityId = source["otherEntityId"];
	        this.otherEntityLabel = source["otherEntityLabel"];
	        this.otherEntityType = source["otherEntityType"];
	    }
	}
	export class SelfReferenceResult {
	    id: number;
	    primaryLabel: string;
	    typeSlug: string;
	    tag: string;
	
	    static createFrom(source: any = {}) {
	        return new SelfReferenceResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.primaryLabel = source["primaryLabel"];
	        this.typeSlug = source["typeSlug"];
	        this.tag = source["tag"];
	    }
	}
	export class TTSResult {
	    audioData: number[];
	    cached: boolean;
	    error: string;
	    errorType: string;
	
	    static createFrom(source: any = {}) {
	        return new TTSResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.audioData = source["audioData"];
	        this.cached = source["cached"];
	        this.error = source["error"];
	        this.errorType = source["errorType"];
	    }
	}
	export class TTSService {
	
	
	    static createFrom(source: any = {}) {
	        return new TTSService(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	
	    }
	}
	export class UnknownTagResult {
	    id: number;
	    primaryLabel: string;
	    typeSlug: string;
	    unknownTags: string[];
	    tagCount: number;
	
	    static createFrom(source: any = {}) {
	        return new UnknownTagResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.primaryLabel = source["primaryLabel"];
	        this.typeSlug = source["typeSlug"];
	        this.unknownTags = source["unknownTags"];
	        this.tagCount = source["tagCount"];
	    }
	}
	export class UnlinkedReferenceDetail {
	    ref: string;
	    reason: string;
	
	    static createFrom(source: any = {}) {
	        return new UnlinkedReferenceDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ref = source["ref"];
	        this.reason = source["reason"];
	    }
	}
	export class UnlinkedReferenceResult {
	    id: number;
	    primaryLabel: string;
	    typeSlug: string;
	    unlinkedRefs: UnlinkedReferenceDetail[];
	    refCount: number;
	
	    static createFrom(source: any = {}) {
	        return new UnlinkedReferenceResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.primaryLabel = source["primaryLabel"];
	        this.typeSlug = source["typeSlug"];
	        this.unlinkedRefs = this.convertValues(source["unlinkedRefs"], UnlinkedReferenceDetail);
	        this.refCount = source["refCount"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace settings {
	
	export class CollapsedState {
	    outgoing: boolean;
	    incoming: boolean;
	    linkIntegrity: boolean;
	    itemHealth: boolean;
	    recentPath: boolean;
	
	    static createFrom(source: any = {}) {
	        return new CollapsedState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.outgoing = source["outgoing"];
	        this.incoming = source["incoming"];
	        this.linkIntegrity = source["linkIntegrity"];
	        this.itemHealth = source["itemHealth"];
	        this.recentPath = source["recentPath"];
	    }
	}
	export class SavedSearch {
	    name: string;
	    query: string;
	    types?: string[];
	    source?: string;
	
	    static createFrom(source: any = {}) {
	        return new SavedSearch(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.query = source["query"];
	        this.types = source["types"];
	        this.source = source["source"];
	    }
	}
	export class TableSort {
	    field1?: string;
	    dir1?: string;
	    field2?: string;
	    dir2?: string;
	
	    static createFrom(source: any = {}) {
	        return new TableSort(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.field1 = source["field1"];
	        this.dir1 = source["dir1"];
	        this.field2 = source["field2"];
	        this.dir2 = source["dir2"];
	    }
	}
	export class Window {
	    x: number;
	    y: number;
	    width: number;
	    height: number;
	    leftbarWidth: number;
	
	    static createFrom(source: any = {}) {
	        return new Window(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.x = source["x"];
	        this.y = source["y"];
	        this.width = source["width"];
	        this.height = source["height"];
	        this.leftbarWidth = source["leftbarWidth"];
	    }
	}
	export class Settings {
	    window: Window;
	    exportFolder: string;
	    lastWordId: number;
	    lastView: string;
	    lastTable: string;
	    tabSelections: Record<string, string>;
	    revealMarkdown: boolean;
	    showMarked: boolean;
	    collapsed: CollapsedState;
	    tableSorts?: Record<string, TableSort>;
	    currentSearch: string;
	    managerOldType: string;
	    managerNewType: string;
	
	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.window = this.convertValues(source["window"], Window);
	        this.exportFolder = source["exportFolder"];
	        this.lastWordId = source["lastWordId"];
	        this.lastView = source["lastView"];
	        this.lastTable = source["lastTable"];
	        this.tabSelections = source["tabSelections"];
	        this.revealMarkdown = source["revealMarkdown"];
	        this.showMarked = source["showMarked"];
	        this.collapsed = this.convertValues(source["collapsed"], CollapsedState);
	        this.tableSorts = this.convertValues(source["tableSorts"], TableSort, true);
	        this.currentSearch = source["currentSearch"];
	        this.managerOldType = source["managerOldType"];
	        this.managerNewType = source["managerNewType"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	

}

