import asyncio
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

async def parse_cs2_demo(file_path: str) -> List[Dict[str, Any]]:
    """
    Parsea de manera asíncrona un archivo .dem usando awpy.
    Retorna una lista de diccionarios listos para usarse y cargar en MatchPlayerStat.
    """
    def _parse_sync():
        from awpy import Demo
        
        logger.info(f"Comenzando a parsear la demo: {file_path}")
        
        demo = Demo(file_path)
        
        kills_df = demo.kills
        
        if kills_df is None or kills_df.empty:
            logger.warning("No se encontraron kills en esta demo.")
            return []

        kills = kills_df.groupby("attacker_name").size().to_dict()
        
        deaths = kills_df.groupby("victim_name").size().to_dict()
        
        assists = {}
        if "assister_name" in kills_df.columns:
            assists_df = kills_df.dropna(subset=["assister_name"])
            assists = assists_df.groupby("assister_name").size().to_dict()

        all_players = set(list(kills.keys()) + list(deaths.keys()) + list(assists.keys()))
        all_players.discard(None)  # Quitamos nulos si existiesen (ej. muertes por entorno)
        
        player_stats = []
        for player in all_players:
            k = kills.get(player, 0)
            d = deaths.get(player, 0)
            a = assists.get(player, 0)
            
            rating = 0.0
            if d > 0:
                rating = round((k + (a * 0.3)) / d, 2)
            else:
                rating = round(k + (a * 0.3), 2)
                
            player_stats.append({
                "nickname": player,  # Podés usar esto luego para hacer match con ProProfile
                "kills": k,
                "deaths": d,
                "assists": a,
                "rating": rating
            })
            
        logger.info(f"Parseo finalizado. {len(player_stats)} jugadores extraídos.")
        return player_stats

    loop = asyncio.get_running_loop()
    
    try:
        stats = await loop.run_in_executor(None, _parse_sync)
        return stats
    except Exception as e:
        logger.error(f"Error parseando la demo {file_path}: {e}")
        raise e
