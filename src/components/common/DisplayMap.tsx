import 'leaflet/dist/leaflet.css';
import {CircleMarker, MapContainer, TileLayer, useMap} from 'react-leaflet';
import type {LocationResponse} from "../../models";
import {useEffect} from "react";
import {MAP_ATTRIBUTION, MAP_TILE_URL} from "../../tools";

type Props = {
    location: LocationResponse;
    heightPx?: number;
    zoom?: number;
    // When true, the map invalidates its size (useful when inside a Modal/Drawer)
    active?: boolean;
};

function toSignedCoord(value: number, ref: 'N' | 'S' | 'E' | 'W'): number {
    if (ref === 'S' || ref === 'W') return -Math.abs(value);
    return Math.abs(value);
}

// Re-invalidate map size after becoming visible and recenter on coord changes
function MapEffects({center, active}: { center: [number, number]; active: boolean }) {
    const map = useMap();

    useEffect(() => {
        if (active) {
            const t = setTimeout(() => {
                map.invalidateSize();
                map.setView(center);
            }, 80);
            return () => clearTimeout(t);
        }
    }, [active, map, center]);

    useEffect(() => {
        map.setView(center);
    }, [center[0], center[1], map]);

    return null;
}

export function DisplayMap({location, heightPx = 240, zoom = 13, active = true}: Props) {
    const lat = toSignedCoord(location.latitude, location.latitude_ref);
    const lon = toSignedCoord(location.longitude, location.longitude_ref);

    return (
            <div style={{width: '100%', height: heightPx}}>
                <MapContainer
                        center={[lat, lon]}
                        zoom={zoom}
                        scrollWheelZoom={false}
                        style={{width: '100%', height: '100%'}}
                >
                    <TileLayer
                            attribution={MAP_ATTRIBUTION}
                            url={MAP_TILE_URL}
                    />
                    <MapEffects center={[lat, lon]} active={!!active}/>
                    <CircleMarker center={[lat, lon]} radius={8} color="red" fillColor="red" fillOpacity={0.8}/>
                </MapContainer>
            </div>
    );
}
