declare module RKIBasis {

    export interface UniqueIdField {
        name: string;
        isSystemMaintained: boolean;
    }

    export interface Field {
        name: string;
        type: string;
        alias: string;
        sqlType: string;
        domain?: any;
        defaultValue?: any;
        length?: number;
    }

    export interface Feature<ATTRIBUTES> {
        attributes: ATTRIBUTES;
        geometry: Geometry;
   }

    export interface Geometry {
        rings: number[][][];
    }

    export interface RootObject<ATTRIBUTES> {
        exceededTransferLimit: boolean | undefined;
        objectIdFieldName: string;
        uniqueIdField: UniqueIdField;
        globalIdFieldName: string;
        fields: Field[];
        features: Feature<ATTRIBUTES>[];
    }
}

declare module RKIBasisWithSpatial {

    export interface SpatialReference {
        wkid: number;
        latestWkid: number;
    }

    export interface RootObject<ATTRIBUTES> extends RKIBasis.RootObject<ATTRIBUTES> {
         spatialReference: SpatialReference;
    }
}

declare module RKI_Landkreisdaten {
    export interface Attributes {
        /** Einwohner BL */
        EWZ_BL: number;
        /**city name */
        GEN: string;
        /**Einwohnerzahl */
        EWZ: number;
        cases: number;
        death_rate: number;
        deaths: number;
        cases7_per_100k: number;
        cases7_bl_per_100k: number;
        /**Bundesland */
        BL: string;
        /**LK name */
        county: string;
    }


    export interface RootObject extends RKIBasisWithSpatial.RootObject<Attributes> {
    }

}


declare module DIVI_Intensivregister_Landkreise {

    export interface GeometryProperties {
        shapeAreaFieldName: string;
        shapeLengthFieldName: string;
        units: string;
    }

    export interface Attributes {
        OBJECTID: number;
        AGS: string;
        BL: string;
        BL_ID: string;
        county: string;
        anzahl_standorte: number;
        anzahl_meldebereiche: number;
        betten_frei: number;
        betten_belegt: number;
        betten_gesamt: number;
        Anteil_betten_frei: number;
        faelle_covid_aktuell: number;
        faelle_covid_aktuell_beatmet: number;
        Anteil_covid_beatmet: number;
        Anteil_COVID_betten: number;
        daten_stand: string;
        Shape__Area: number;
        Shape__Length: number;
        betten_belegt_erw: number;
        betten_gesamt_erw: number;
        anteil_betten_frei_erw: number;
        betten_frei_erw: number;
    }


    export interface RootObject extends RKIBasisWithSpatial.RootObject<Attributes> {
        geometryProperties: GeometryProperties;
    }

}

declare module Covid19_RKI_Sums {

    export interface Attributes {
        AnzahlFall: number;
        AnzahlTodesfall: number;
        SummeFall: number;
        SummeTodesfall: number;
        ObjectId: number;
        Datenstand: string;
        /** Datum as js date number */
        Meldedatum: number;
        Bundesland: string;
        IdBundesland: number;
        Landkreis: string;
        IdLandkreis: string;
        AnzahlGenesen: number;
        SummeGenesen: number;
    }

    export interface RootObject extends RKIBasis.RootObject<Attributes> {

    }

}

declare module rki_history_hubv {

    export interface Attributes {
        AdmUnitId: number;
        BundeslandId: number;
        /** Datum as js date number */
        Datum: number;
        AnzFallNeu: number;
        AnzFallVortag: number;
        AnzFallErkrankung: number;
        AnzFallMeldung: number;
        KumFall: number;
        ObjectId: number;
    }

    export interface RootObject extends RKIBasis.RootObject<Attributes> {

    }

}