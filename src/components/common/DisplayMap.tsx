import 'leaflet/dist/leaflet.css';
import {CircleMarker, MapContainer, TileLayer} from 'react-leaflet';
import type {LocationResponse} from "../../models";

type Props = {
    location: LocationResponse;
    heightPx?: number;
    zoom?: number;
};

function toSignedCoord(value: number, ref: 'N' | 'S' | 'E' | 'W'): number {
    if (ref === 'S' || ref === 'W') return -Math.abs(value);
    return Math.abs(value);
}

export function DisplayMap({location, heightPx = 240, zoom = 13}: Props) {
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
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <CircleMarker center={[lat, lon]} radius={8} color="red" fillColor="red" fillOpacity={0.8}/>
                </MapContainer>
            </div>
    );
}

