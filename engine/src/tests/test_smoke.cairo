#[cfg(test)]
mod tests {
    use parchis_trivia_engine::constants::{
        config_status, game_status, item_effect_type, turn_phase,
    };

    #[test]
    fn status_constants_are_stable() {
        assert(game_status::WAITING == 0, 'waiting changed');
        assert(game_status::IN_PROGRESS == 1, 'in progress changed');
        assert(game_status::FINISHED == 2, 'finished changed');
    }

    #[test]
    fn gameplay_constants_match_spec() {
        assert(turn_phase::ROLL_AND_QUESTION == 0, 'phase mismatch');
        assert(item_effect_type::SHIELD == 0, 'item mismatch');
        assert(config_status::DRAFT == 0, 'config mismatch');
    }
}
