use crate::types::{AnswerPayload, LegalMove, MoveInput, MovePlan};

#[starknet::interface]
pub trait ITurnSystem<T> {
    fn roll_two_dice_and_draw_question(ref self: T, game_id: u64);
    fn submit_answer(ref self: T, game_id: u64, answer_payload: AnswerPayload);
    fn apply_move(ref self: T, game_id: u64, move_input: MoveInput);
    fn end_turn(ref self: T, game_id: u64);
    fn compute_legal_moves(self: @T, game_id: u64) -> Array<LegalMove>;
    fn submit_answer_and_moves(
        ref self: T, game_id: u64, answer_payload: AnswerPayload, move_plan: MovePlan,
    );
    fn force_skip_turn(ref self: T, game_id: u64);
}

#[dojo::contract]
pub mod turn_system {
    use cartridge_vrf::{IVrfProviderDispatcher, IVrfProviderDispatcherTrait, Source};
    use core::poseidon::poseidon_hash_span;
    use crate::constants::{
        DEFAULT_ALLOW_SPLIT_DICE, DEFAULT_ALLOW_SUM_DICE, DEFAULT_ALLOW_TWO_STEP_SAME_TOKEN,
        DEFAULT_QUESTION_SET_ID, DEFAULT_REQUIRES_EXACT_HOME, DEFAULT_VRF_PROVIDER_ADDRESS,
        HARD_DIFFICULTY_REWARD_COINS, HOME_LANE_LEN, MAIN_TRACK_LEN, MAX_SEATS,
        MEDIUM_DIFFICULTY_REWARD_COINS, TOKENS_PER_PLAYER, TRACK_STEPS_TO_HOME_ENTRY,
        VRF_CONFIG_SINGLETON_ID, bonus_type, difficulty_level,
        egs_link_status, game_status, move_type, token_state, turn_phase,
        EASY_DIFFICULTY_REWARD_COINS,
    };
    use crate::events::{
        AnswerResolved, AnswerRevealed, BonusAwarded, BonusConsumed, BlockadeBroken,
        BlockadeCreated, BridgeBroken, BridgeFormed, DiceRolled, GameWon, QuestionDrawn, TokenCaptured, TokenMoved,
        TokenReachedHome, TurnEnded, TurnStarted,
    };
    use crate::models::{
        BoardSquare, BonusState, DiceState, Game, GamePlayer, GameRuntimeConfig, GameSeat,
        PendingQuestion, QuestionSet, SquareOccupancy, Token, TurnState, VrfConfig,
    };
    use crate::systems::egs_system::egs_system::{
        assert_bound_token_playable, sync_bound_player_state, sync_bound_players_terminal,
    };
    use crate::types::{AnswerPayload, LegalMove, MoveInput, MovePlan, MoveStep};
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
    use super::ITurnSystem;

    const NO_BLOCKADE_OWNER: u8 = 255;

    #[abi(embed_v0)]
    impl TurnSystemImpl of ITurnSystem<ContractState> {
        fn roll_two_dice_and_draw_question(ref self: ContractState, game_id: u64) {
            let mut world = self.world_default();
            let caller = get_caller_address();
            let now = get_block_timestamp();

            let mut game: Game = world.read_model(game_id);
            assert(game.status == game_status::IN_PROGRESS, 'not_live');
            assert(game.active_player == caller, 'not_active');
            assert_bound_token_playable(ref world, game_id, caller);

            let mut turn: TurnState = world.read_model(game_id);
            assert(turn.phase == turn_phase::ROLL_AND_QUESTION, 'phase');

            let runtime: GameRuntimeConfig = world.read_model(game_id);
            let question_set: QuestionSet = world.read_model(DEFAULT_QUESTION_SET_ID);
            assert(question_set.set_id == DEFAULT_QUESTION_SET_ID, 'q_set');
            assert(question_set.enabled, 'q_disabled');
            assert(question_set.question_count > 0, 'q_count');

            let vrf_provider = IVrfProviderDispatcher {
                contract_address: load_vrf_provider_address(ref world),
            };

            let vrf_random: felt252 = vrf_provider.consume_random(Source::Nonce(caller));
            let random_die_1 = poseidon_hash_span(array![vrf_random, 1].span());
            let random_die_2 = poseidon_hash_span(array![vrf_random, 2].span());
            let random_question = poseidon_hash_span(array![vrf_random, 3].span());

            let dice_1 = random_dice_value(random_die_1);
            let dice_2 = random_dice_value(random_die_2);
            let question_index = random_question_index(random_question, question_set.question_count);
            let difficulty = runtime.difficulty_level;
            let question_id = make_question_id(game.turn_index, question_index);

            if should_skip_question_for_trapped_player(
                ref world, game.game_id, caller, runtime.exit_home_rule, dice_1, dice_2,
            ) {
                world.emit_event(@DiceRolled { game_id, turn_index: game.turn_index, dice_1, dice_2 });
                end_turn_internal(ref world, ref game, ref turn, runtime, now, false);
                return;
            }

            let pending = PendingQuestion {
                game_id,
                turn_index: game.turn_index,
                set_id: DEFAULT_QUESTION_SET_ID,
                question_index,
                category: 0,
                difficulty,
                seed_nonce: vrf_random,
            };

            let dice_state = DiceState {
                game_id,
                die_a: dice_1,
                die_b: dice_2,
                die_a_used: false,
                die_b_used: false,
                sum_used: false,
            };

            turn.phase = turn_phase::ANSWER_PENDING;
            turn.dice_1 = dice_1;
            turn.dice_2 = dice_2;
            turn.die1_used = false;
            turn.die2_used = false;
            turn.question_id = question_id;
            turn.question_answered = false;
            turn.question_correct = false;
            turn.has_moved_token = false;
            turn.first_moved_token_id = 0;
            turn.deadline = now + runtime.answer_time_limit_secs.into();

            let mut bonus_state: BonusState = world.read_model((game_id, caller));
            bonus_state.bonus_consumed = false;

            world.write_model(@pending);
            world.write_model(@turn);
            world.write_model(@dice_state);
            world.write_model(@bonus_state);
            world.emit_event(@DiceRolled { game_id, turn_index: game.turn_index, dice_1, dice_2 });
            world.emit_event(@QuestionDrawn {
                game_id,
                turn_index: game.turn_index,
                question_id,
                difficulty,
            });
        }

        fn submit_answer(ref self: ContractState, game_id: u64, answer_payload: AnswerPayload) {
            let mut world = self.world_default();
            let caller = get_caller_address();
            let now = get_block_timestamp();

            let mut game: Game = world.read_model(game_id);
            assert(game.status == game_status::IN_PROGRESS, 'not_live');
            assert(game.active_player == caller, 'not_active');
            assert_bound_token_playable(ref world, game_id, caller);

            let mut turn: TurnState = world.read_model(game_id);
            assert(turn.phase == turn_phase::ANSWER_PENDING, 'phase');

            let runtime: GameRuntimeConfig = world.read_model(game_id);
            let correct = resolve_answer_internal(
                ref world,
                game,
                runtime,
                caller,
                ref turn,
                answer_payload,
            );

            if !correct {
                end_turn_internal(ref world, ref game, ref turn, runtime, now, false);
                return;
            }

            turn.phase = turn_phase::MOVE_PENDING;
            turn.deadline = now + runtime.turn_time_limit_secs.into();
            turn.has_moved_token = false;
            turn.first_moved_token_id = 0;
            world.write_model(@turn);

            let legal = compute_legal_moves_internal(ref world, game, runtime, caller, turn);
            if legal.len() == 0 {
                let mut refreshed_turn: TurnState = world.read_model(game_id);
                end_turn_internal(ref world, ref game, ref refreshed_turn, runtime, now, false);
            }
        }

        fn apply_move(ref self: ContractState, game_id: u64, move_input: MoveInput) {
            let mut world = self.world_default();
            let caller = get_caller_address();
            let now = get_block_timestamp();

            let mut game: Game = world.read_model(game_id);
            assert(game.status == game_status::IN_PROGRESS, 'not_live');
            assert(game.active_player == caller, 'not_active');
            assert_bound_token_playable(ref world, game_id, caller);

            let mut turn: TurnState = world.read_model(game_id);
            assert(turn.phase == turn_phase::MOVE_PENDING, 'phase');

            let runtime: GameRuntimeConfig = world.read_model(game_id);
            apply_move_internal(ref world, game, runtime, caller, ref turn, move_input, now);

            let winner = winner_if_any(ref world, game.game_id);
            if winner != zero_address() {
                game.status = game_status::FINISHED;
                game.winner = winner;
                game.updated_at = now;

                turn.phase = turn_phase::TURN_ENDED;
                turn.deadline = 0;

                world.write_model(@game);
                world.write_model(@turn);
                sync_bound_players_terminal(
                    ref world, game.game_id, winner, egs_link_status::FINISHED,
                );
                world.emit_event(@GameWon { game_id: game.game_id, winner, turn_index: game.turn_index });
                return;
            }

            world.write_model(@turn);
        }

        fn end_turn(ref self: ContractState, game_id: u64) {
            let mut world = self.world_default();
            let caller = get_caller_address();
            let now = get_block_timestamp();

            let mut game: Game = world.read_model(game_id);
            assert(game.status == game_status::IN_PROGRESS, 'not_live');
            assert(game.active_player == caller, 'not_active');
            assert_bound_token_playable(ref world, game_id, caller);

            let mut turn: TurnState = world.read_model(game_id);
            let runtime: GameRuntimeConfig = world.read_model(game_id);
            end_turn_internal(ref world, ref game, ref turn, runtime, now, true);
        }

        fn compute_legal_moves(self: @ContractState, game_id: u64) -> Array<LegalMove> {
            let mut world = self.world_default();

            let game: Game = world.read_model(game_id);
            if game.status != game_status::IN_PROGRESS {
                return array![];
            }

            let turn: TurnState = world.read_model(game_id);
            if turn.phase != turn_phase::MOVE_PENDING {
                return array![];
            }

            let runtime: GameRuntimeConfig = world.read_model(game_id);
            compute_legal_moves_internal(ref world, game, runtime, game.active_player, turn)
        }

        fn submit_answer_and_moves(
            ref self: ContractState, game_id: u64, answer_payload: AnswerPayload,
            move_plan: MovePlan,
        ) {
            let mut world = self.world_default();
            let caller = get_caller_address();
            let now = get_block_timestamp();

            let mut game: Game = world.read_model(game_id);
            assert(game.status == game_status::IN_PROGRESS, 'not_live');
            assert(game.active_player == caller, 'not_active');
            assert_bound_token_playable(ref world, game_id, caller);

            let mut turn: TurnState = world.read_model(game_id);
            assert(turn.phase == turn_phase::ANSWER_PENDING, 'phase');

            let runtime: GameRuntimeConfig = world.read_model(game_id);
            let correct = resolve_answer_internal(
                ref world,
                game,
                runtime,
                caller,
                ref turn,
                answer_payload,
            );

            if !correct {
                end_turn_internal(ref world, ref game, ref turn, runtime, now, false);
                return;
            }

            turn.phase = turn_phase::MOVE_PENDING;
            turn.deadline = now + runtime.turn_time_limit_secs.into();
            turn.has_moved_token = false;
            turn.first_moved_token_id = 0;
            world.write_model(@turn);

            if move_plan.use_step_1 {
                let move_input = move_input_from_legacy_step(
                    ref world,
                    game,
                    runtime,
                    caller,
                    move_plan.step_1,
                );
                apply_move_internal(ref world, game, runtime, caller, ref turn, move_input, now);
            }

            if move_plan.use_step_2 {
                let move_input = move_input_from_legacy_step(
                    ref world,
                    game,
                    runtime,
                    caller,
                    move_plan.step_2,
                );
                apply_move_internal(ref world, game, runtime, caller, ref turn, move_input, now);
            }

            let winner = winner_if_any(ref world, game.game_id);
            if winner != zero_address() {
                game.status = game_status::FINISHED;
                game.winner = winner;
                game.updated_at = now;

                turn.phase = turn_phase::TURN_ENDED;
                turn.deadline = 0;

                world.write_model(@game);
                world.write_model(@turn);
                sync_bound_players_terminal(
                    ref world, game.game_id, winner, egs_link_status::FINISHED,
                );
                world.emit_event(@GameWon { game_id: game.game_id, winner, turn_index: game.turn_index });
                return;
            }

            end_turn_internal(ref world, ref game, ref turn, runtime, now, true);
        }

        fn force_skip_turn(ref self: ContractState, game_id: u64) {
            let mut world = self.world_default();
            let now = get_block_timestamp();

            let mut game: Game = world.read_model(game_id);
            assert(game.status == game_status::IN_PROGRESS, 'not_live');

            let mut turn: TurnState = world.read_model(game_id);
            assert(now > turn.deadline, 'deadline');

            let runtime: GameRuntimeConfig = world.read_model(game_id);
            end_turn_internal(ref world, ref game, ref turn, runtime, now, false);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"parquiz")
        }
    }

    fn resolve_answer_internal(
        ref world: dojo::world::WorldStorage, game: Game, runtime: GameRuntimeConfig,
        caller: ContractAddress, ref turn: TurnState, answer_payload: AnswerPayload,
    ) -> bool {
        let pending: PendingQuestion = world.read_model((game.game_id, game.turn_index));
        let question_set: QuestionSet = world.read_model(DEFAULT_QUESTION_SET_ID);
        assert(question_set.set_id == DEFAULT_QUESTION_SET_ID, 'q_set');
        assert(question_set.enabled, 'q_disabled');

        let payload_question_id = answer_payload.question_id;
        let payload_question_index = answer_payload.question_index;
        let payload_category = answer_payload.category;
        let payload_correct_option = answer_payload.correct_option;
        let payload_selected_option = answer_payload.selected_option;
        let payload_proof = answer_payload.merkle_proof;
        let payload_directions = answer_payload.merkle_directions;

        assert(pending.turn_index == game.turn_index, 'pending_q');
        assert(turn.question_id == payload_question_id, 'q_id');
        assert(payload_question_index == pending.question_index, 'q_index');
        assert(payload_category == pending.category, 'q_cat');

        let leaf_hash =
            build_question_leaf_hash(payload_question_index, payload_category, payload_correct_option);

        let proof_ok = verify_merkle_proof(
            leaf_hash,
            payload_proof,
            payload_directions,
            question_set.merkle_root,
        );
        assert(proof_ok, 'q_proof');

        let correct = payload_selected_option == payload_correct_option;
        let reward = if correct { reward_for_difficulty(pending.difficulty) } else { 0 };

        let mut player: GamePlayer = world.read_model((game.game_id, caller));
        if correct {
            player.coins += reward;
            world.write_model(@player);
        }

        turn.question_answered = true;
        turn.question_correct = correct;
        sync_bound_player_state(
            ref world,
            game.game_id,
            caller,
            false,
            false,
            egs_link_status::ACTIVE,
        );
        world.emit_event(@AnswerResolved {
            game_id: game.game_id,
            player: caller,
            correct,
            reward,
        });
        world.emit_event(@AnswerRevealed {
            game_id: game.game_id,
            player: caller,
            question_id: payload_question_id,
            selected_option: payload_selected_option,
            correct,
            reward,
        });
        correct
    }

    fn apply_move_internal(
        ref world: dojo::world::WorldStorage, game: Game, runtime: GameRuntimeConfig,
        caller: ContractAddress, ref turn: TurnState, move_input: MoveInput, now: u64,
    ) {
        let turn_snapshot: TurnState = world.read_model(game.game_id);
        let legal_moves =
            compute_legal_moves_internal(ref world, game, runtime, caller, turn_snapshot);
        let is_legal = move_exists_in_list(legal_moves, move_input);
        assert(is_legal, 'illegal_move');

        enforce_move_sequence(runtime, ref turn, move_input.token_id);

        let mut dice_state: DiceState = world.read_model(game.game_id);
        let mut bonus_state: BonusState = world.read_model((game.game_id, caller));

        let (steps, consumed_bonus_type) = consume_move_resource(
            runtime,
            ref dice_state,
            ref bonus_state,
            move_input,
        );

        sync_turn_with_dice(ref turn, dice_state);

        apply_move_step(
            ref world,
            game,
            runtime,
            caller,
            move_input.token_id,
            steps,
            ref bonus_state,
        );

        if consumed_bonus_type != bonus_type::NONE {
            world.emit_event(@BonusConsumed {
                game_id: game.game_id,
                player: caller,
                bonus_type: consumed_bonus_type,
                pending_bonus_10: bonus_state.pending_bonus_10,
                pending_bonus_20: bonus_state.pending_bonus_20,
            });
        }

        world.write_model(@dice_state);
        world.write_model(@bonus_state);
        world.write_model(@turn);
        sync_bound_player_state(
            ref world,
            game.game_id,
            caller,
            false,
            false,
            egs_link_status::ACTIVE,
        );
    }

    fn end_turn_internal(
        ref world: dojo::world::WorldStorage, ref game: Game, ref turn: TurnState,
        runtime: GameRuntimeConfig, now: u64, enforce_moves: bool,
    ) {
        if turn.phase == turn_phase::MOVE_PENDING && enforce_moves {
            let game_snapshot: Game = world.read_model(game.game_id);
            let turn_snapshot: TurnState = world.read_model(game.game_id);
            let legal =
                compute_legal_moves_internal(
                    ref world,
                    game_snapshot,
                    runtime,
                    game.active_player,
                    turn_snapshot,
                );
            assert(legal.len() == 0, 'moves_pending');
        }

        end_turn_and_advance(ref world, ref game, ref turn, runtime, now);
    }

    fn compute_legal_moves_internal(
        ref world: dojo::world::WorldStorage, game: Game, runtime: GameRuntimeConfig,
        player: ContractAddress, turn: TurnState,
    ) -> Array<LegalMove> {
        let mut legal_moves: Array<LegalMove> = array![];

        if turn.phase != turn_phase::MOVE_PENDING {
            return legal_moves;
        }

        let player_state: GamePlayer = world.read_model((game.game_id, player));
        if !player_state.is_active {
            return legal_moves;
        }

        let dice_state: DiceState = world.read_model(game.game_id);
        let bonus_state: BonusState = world.read_model((game.game_id, player));
        let forced_bridge_break =
            forced_bridge_break_required(ref world, game.game_id, player, turn, dice_state);

        let mut token_id: u8 = 0;
        loop {
            if token_id >= TOKENS_PER_PLAYER {
                break;
            }

            if !is_token_allowed_by_sequence(runtime, turn, token_id) {
                token_id += 1;
                continue;
            }

            let token: Token = world.read_model((game.game_id, player, token_id));
            if forced_bridge_break && !token_is_on_player_bridge(ref world, game.game_id, player, token) {
                token_id += 1;
                continue;
            }

            if !dice_state.die_a_used {
                append_legal_move_for_steps(
                    ref legal_moves,
                    ref world,
                    game,
                    runtime,
                    player_state,
                    token,
                    move_type::DIE_A,
                    dice_state.die_a,
                );
            }

            if !dice_state.die_b_used {
                append_legal_move_for_steps(
                    ref legal_moves,
                    ref world,
                    game,
                    runtime,
                    player_state,
                    token,
                    move_type::DIE_B,
                    dice_state.die_b,
                );
            }

            if !forced_bridge_break && DEFAULT_ALLOW_SUM_DICE && !dice_state.sum_used && !dice_state.die_a_used && !dice_state.die_b_used {
                append_legal_move_for_steps(
                    ref legal_moves,
                    ref world,
                    game,
                    runtime,
                    player_state,
                    token,
                    move_type::SUM,
                    dice_state.die_a + dice_state.die_b,
                );
            }

            if !forced_bridge_break && bonus_state.pending_bonus_10 > 0 {
                append_legal_move_for_steps(
                    ref legal_moves,
                    ref world,
                    game,
                    runtime,
                    player_state,
                    token,
                    move_type::BONUS_10,
                    10,
                );
            }

            if !forced_bridge_break && bonus_state.pending_bonus_20 > 0 {
                append_legal_move_for_steps(
                    ref legal_moves,
                    ref world,
                    game,
                    runtime,
                    player_state,
                    token,
                    move_type::BONUS_20,
                    20,
                );
            }

            token_id += 1;
        }

        legal_moves
    }

    fn append_legal_move_for_steps(
        ref legal_moves: Array<LegalMove>, ref world: dojo::world::WorldStorage, game: Game,
        runtime: GameRuntimeConfig, player_state: GamePlayer, token: Token, source_move_type: u8,
        steps: u8,
    ) {
        if steps == 0 {
            return;
        }

        if token.token_state == token_state::IN_BASE {
            if !can_use_single_die_to_exit_home(source_move_type) {
                return;
            }

            if !can_exit_home(runtime.exit_home_rule, steps) {
                return;
            }

            if player_state.tokens_in_base == 0 {
                return;
            }

            let spawn_track_pos = start_index_for_seat(player_state.seat);
            let blockade_owner = track_blockade_owner(ref world, game.game_id, spawn_track_pos);
            if blockade_owner != NO_BLOCKADE_OWNER {
                return;
            }

            legal_moves
                .append(
                    LegalMove {
                        move_type: move_type::EXIT_HOME,
                        token_id: token.token_id,
                        steps,
                        target_square_ref: track_square_ref(spawn_track_pos),
                    },
                );
            return;
        }

        let can_move =
            token_has_legal_move_for_steps(ref world, game, runtime, player_state, token, steps);
        if !can_move {
            return;
        }

        let target_square_ref = preview_target_square_ref(runtime, player_state.seat, token, steps);
        legal_moves
            .append(
                LegalMove {
                    move_type: source_move_type,
                    token_id: token.token_id,
                    steps,
                    target_square_ref,
                },
            );
    }

    fn token_has_legal_move_for_steps(
        ref world: dojo::world::WorldStorage, game: Game, _runtime: GameRuntimeConfig,
        player_state: GamePlayer, token: Token, steps: u8,
    ) -> bool {
        if token.token_state == token_state::ON_TRACK {
            if is_path_blocked(ref world, game, token, steps) {
                return false;
            }

            return can_advance_track_without_overflow(token, steps, DEFAULT_REQUIRES_EXACT_HOME);
        }

        if token.token_state == token_state::IN_HOME_LANE {
            return can_advance_home_without_overflow(token, steps, DEFAULT_REQUIRES_EXACT_HOME);
        }

        false
    }

    fn can_advance_track_without_overflow(token: Token, steps: u8, requires_exact_home: bool) -> bool {
        let target_steps: u16 = token.steps_total + steps.into();
        let center_steps = total_steps_to_center();
        if requires_exact_home {
            return target_steps <= center_steps;
        }
        true
    }

    fn can_advance_home_without_overflow(token: Token, steps: u8, requires_exact_home: bool) -> bool {
        let target_home: u16 = token.home_lane_pos.into() + steps.into();
        if requires_exact_home {
            return target_home <= HOME_LANE_LEN.into();
        }
        true
    }

    fn move_exists_in_list(mut legal_moves: Array<LegalMove>, move_input: MoveInput) -> bool {
        loop {
            match legal_moves.pop_front() {
                Option::Some(legal_move) => {
                    if legal_move.move_type == move_input.move_type && legal_move.token_id == move_input.token_id && legal_move.steps == move_input.steps {
                        return true;
                    }
                },
                Option::None => {
                    break;
                },
            }
        }
        false
    }

    fn is_token_allowed_by_sequence(_runtime: GameRuntimeConfig, turn: TurnState, token_id: u8) -> bool {
        if !turn.has_moved_token {
            return true;
        }

        if token_id != turn.first_moved_token_id {
            return DEFAULT_ALLOW_SPLIT_DICE;
        }

        DEFAULT_ALLOW_TWO_STEP_SAME_TOKEN
    }

    fn enforce_move_sequence(_runtime: GameRuntimeConfig, ref turn: TurnState, token_id: u8) {
        if !turn.has_moved_token {
            turn.has_moved_token = true;
            turn.first_moved_token_id = token_id;
            return;
        }

        if token_id != turn.first_moved_token_id {
            assert(DEFAULT_ALLOW_SPLIT_DICE, 'split_disabled');
            return;
        }

        assert(DEFAULT_ALLOW_TWO_STEP_SAME_TOKEN, 'same_token_disabled');
    }

    fn consume_move_resource(
        _runtime: GameRuntimeConfig, ref dice_state: DiceState, ref bonus_state: BonusState,
        move_input: MoveInput,
    ) -> (u8, u8) {
        if move_input.move_type == move_type::DIE_A {
            assert(!dice_state.die_a_used, 'die_a_used');
            dice_state.die_a_used = true;
            return (dice_state.die_a, bonus_type::NONE);
        }

        if move_input.move_type == move_type::DIE_B {
            assert(!dice_state.die_b_used, 'die_b_used');
            dice_state.die_b_used = true;
            return (dice_state.die_b, bonus_type::NONE);
        }

        if move_input.move_type == move_type::SUM {
            assert(DEFAULT_ALLOW_SUM_DICE, 'sum_disabled');
            assert(!dice_state.sum_used, 'sum_used');
            assert(!dice_state.die_a_used, 'die_a_used');
            assert(!dice_state.die_b_used, 'die_b_used');

            dice_state.sum_used = true;
            dice_state.die_a_used = true;
            dice_state.die_b_used = true;
            return (dice_state.die_a + dice_state.die_b, bonus_type::NONE);
        }

        if move_input.move_type == move_type::BONUS_10 {
            assert(bonus_state.pending_bonus_10 > 0, 'bonus10_none');
            bonus_state.pending_bonus_10 -= 1;
            bonus_state.bonus_consumed = true;
            return (10, bonus_type::BONUS_10);
        }

        if move_input.move_type == move_type::BONUS_20 {
            assert(bonus_state.pending_bonus_20 > 0, 'bonus20_none');
            bonus_state.pending_bonus_20 -= 1;
            bonus_state.bonus_consumed = true;
            return (20, bonus_type::BONUS_20);
        }

        if move_input.move_type == move_type::EXIT_HOME {
            return consume_exit_home_resource(_runtime, ref dice_state, ref bonus_state, move_input.steps);
        }

        assert(false, 'move_type');
        (0, bonus_type::NONE)
    }

    fn consume_exit_home_resource(
        _runtime: GameRuntimeConfig, ref dice_state: DiceState, ref _bonus_state: BonusState, steps: u8,
    ) -> (u8, u8) {
        if !dice_state.die_a_used && dice_state.die_a == steps {
            dice_state.die_a_used = true;
            return (steps, bonus_type::NONE);
        }

        if !dice_state.die_b_used && dice_state.die_b == steps {
            dice_state.die_b_used = true;
            return (steps, bonus_type::NONE);
        }

        assert(false, 'exit_steps');
        (0, bonus_type::NONE)
    }

    fn sync_turn_with_dice(ref turn: TurnState, dice_state: DiceState) {
        turn.dice_1 = dice_state.die_a;
        turn.dice_2 = dice_state.die_b;
        turn.die1_used = dice_state.die_a_used;
        turn.die2_used = dice_state.die_b_used;
    }

    fn move_input_from_legacy_step(
        ref world: dojo::world::WorldStorage, game: Game, runtime: GameRuntimeConfig,
        caller: ContractAddress, step: MoveStep,
    ) -> MoveInput {
        if step.action_type <= move_type::EXIT_HOME {
            return MoveInput {
                move_type: step.action_type,
                token_id: step.token_id,
                steps: step.die_value,
            };
        }

        let dice_state: DiceState = world.read_model(game.game_id);
        let bonus_state: BonusState = world.read_model((game.game_id, caller));

        if !dice_state.die_a_used && dice_state.die_a == step.die_value {
            return MoveInput { move_type: move_type::DIE_A, token_id: step.token_id, steps: step.die_value };
        }

        if !dice_state.die_b_used && dice_state.die_b == step.die_value {
            return MoveInput { move_type: move_type::DIE_B, token_id: step.token_id, steps: step.die_value };
        }

        if DEFAULT_ALLOW_SUM_DICE && !dice_state.sum_used && !dice_state.die_a_used && !dice_state.die_b_used && (dice_state.die_a + dice_state.die_b) == step.die_value {
            return MoveInput { move_type: move_type::SUM, token_id: step.token_id, steps: step.die_value };
        }

        if bonus_state.pending_bonus_10 > 0 && step.die_value == 10 {
            return MoveInput { move_type: move_type::BONUS_10, token_id: step.token_id, steps: 10 };
        }

        if bonus_state.pending_bonus_20 > 0 && step.die_value == 20 {
            return MoveInput { move_type: move_type::BONUS_20, token_id: step.token_id, steps: 20 };
        }

        MoveInput { move_type: move_type::EXIT_HOME, token_id: step.token_id, steps: step.die_value }
    }

    fn preview_target_square_ref(
        _runtime: GameRuntimeConfig, seat: u8, token: Token, steps: u8,
    ) -> u32 {
        if token.token_state == token_state::IN_BASE {
            return track_square_ref(start_index_for_seat(seat));
        }

        let mut preview = token;
        if preview.token_state == token_state::ON_TRACK {
            preview_advance_from_track(ref preview, steps, DEFAULT_REQUIRES_EXACT_HOME);
        } else {
            preview_advance_from_home_lane(ref preview, steps, DEFAULT_REQUIRES_EXACT_HOME);
        }

        square_ref_for_token(seat, preview)
    }

    fn apply_move_step(
        ref world: dojo::world::WorldStorage, game: Game, runtime: GameRuntimeConfig,
        player: ContractAddress, token_id: u8, die_value: u8, ref bonus_state: BonusState,
    ) {
        assert(die_value > 0, 'die_zero');

        let mut player_state: GamePlayer = world.read_model((game.game_id, player));
        assert(player_state.is_active, 'not_player');

        let mut token: Token = world.read_model((game.game_id, player, token_id));
        let from_square_ref = square_ref_for_token(player_state.seat, token);

        if token.token_state == token_state::IN_BASE {
            assert(can_exit_home(runtime.exit_home_rule, die_value), 'spawn_rule');

            let spawn_track_pos = start_index_for_seat(player_state.seat);
            let blockade_owner = track_blockade_owner(
                ref world,
                game.game_id,
                spawn_track_pos,
            );
            assert(blockade_owner == NO_BLOCKADE_OWNER, 'spawn_blocked');

            assert(player_state.tokens_in_base > 0, 'no_base');
            player_state.tokens_in_base -= 1;

            token.token_state = token_state::ON_TRACK;
            token.track_pos = spawn_track_pos;
            token.home_lane_pos = 0;
            token.steps_total = 0;
        } else if token.token_state == token_state::ON_TRACK {
            assert_path_not_blocked(ref world, game, token, die_value);
            advance_from_track(ref token, die_value, DEFAULT_REQUIRES_EXACT_HOME);

            if token.token_state == token_state::IN_CENTER {
                player_state.tokens_in_goal += 1;
                award_home_bonus(ref bonus_state);
                world.emit_event(@TokenReachedHome {
                    game_id: game.game_id,
                    player,
                    token_id,
                    bonus_awarded: bonus_type::BONUS_10,
                });
                world.emit_event(@BonusAwarded {
                    game_id: game.game_id,
                    player,
                    bonus_type: bonus_type::BONUS_10,
                    pending_bonus_10: bonus_state.pending_bonus_10,
                    pending_bonus_20: bonus_state.pending_bonus_20,
                });
            }
        } else if token.token_state == token_state::IN_HOME_LANE {
            advance_from_home_lane(ref token, die_value, DEFAULT_REQUIRES_EXACT_HOME);

            if token.token_state == token_state::IN_CENTER {
                player_state.tokens_in_goal += 1;
                award_home_bonus(ref bonus_state);
                world.emit_event(@TokenReachedHome {
                    game_id: game.game_id,
                    player,
                    token_id,
                    bonus_awarded: bonus_type::BONUS_10,
                });
                world.emit_event(@BonusAwarded {
                    game_id: game.game_id,
                    player,
                    bonus_type: bonus_type::BONUS_10,
                    pending_bonus_10: bonus_state.pending_bonus_10,
                    pending_bonus_20: bonus_state.pending_bonus_20,
                });
            }
        } else {
            assert(false, 'token_center');
        }

        world.write_model(@player_state);
        world.write_model(@token);

        let to_square_ref = square_ref_for_token(player_state.seat, token);

        if from_square_ref != 0 {
            recompute_square_occupancy(ref world, game.game_id, from_square_ref);
        }
        if to_square_ref != 0 {
            recompute_square_occupancy(ref world, game.game_id, to_square_ref);
        }

        if token.token_state == token_state::ON_TRACK {
            let is_safe = is_track_square_safe(ref world, game.config_id, token.track_pos);
            if !is_safe {
                resolve_capture_if_any(
                    ref world,
                    game,
                    player,
                    player_state.seat,
                    token.track_pos,
                    ref bonus_state,
                );
                recompute_square_occupancy(ref world, game.game_id, to_square_ref);
            }
        }

        world.emit_event(@TokenMoved {
            game_id: game.game_id,
            player,
            token_id,
            from_square_ref,
            to_square_ref,
            die_value,
        });

        if token.token_state != token_state::ON_TRACK {
            return;
        }
    }

    fn resolve_capture_if_any(
        ref world: dojo::world::WorldStorage, game: Game, attacker: ContractAddress,
        attacker_seat: u8, track_pos: u16, ref attacker_bonus: BonusState,
    ) {
        let mut captured_player = zero_address();
        let mut captured_token_id: u8 = 0;
        let mut rivals_on_square: u8 = 0;

        let mut seat: u8 = 0;
        loop {
            if seat >= MAX_SEATS {
                break;
            }

            let game_seat: GameSeat = world.read_model((game.game_id, seat));
            if game_seat.occupied && seat != attacker_seat {
                let mut token_id: u8 = 0;
                loop {
                    if token_id >= TOKENS_PER_PLAYER {
                        break;
                    }

                    let rival_token: Token = world.read_model((game.game_id, game_seat.player, token_id));
                    if rival_token.token_state == token_state::ON_TRACK && rival_token.track_pos == track_pos {
                        rivals_on_square += 1;
                        captured_player = game_seat.player;
                        captured_token_id = token_id;
                    }

                    token_id += 1;
                }
            }

            seat += 1;
        }

        if rivals_on_square != 1 {
            return;
        }

        let mut rival_token: Token = world.read_model((game.game_id, captured_player, captured_token_id));
        rival_token.token_state = token_state::IN_BASE;
        rival_token.track_pos = 0;
        rival_token.home_lane_pos = 0;
        rival_token.steps_total = 0;
        world.write_model(@rival_token);

        let mut rival_player: GamePlayer = world.read_model((game.game_id, captured_player));
        rival_player.tokens_in_base += 1;
        world.write_model(@rival_player);

        award_capture_bonus(ref attacker_bonus);

        world.emit_event(@TokenCaptured {
            game_id: game.game_id,
            attacker,
            defender: captured_player,
            defender_token_id: captured_token_id,
            square_ref: track_square_ref(track_pos),
            bonus_awarded: bonus_type::BONUS_20,
        });
        world.emit_event(@BonusAwarded {
            game_id: game.game_id,
            player: attacker,
            bonus_type: bonus_type::BONUS_20,
            pending_bonus_10: attacker_bonus.pending_bonus_10,
            pending_bonus_20: attacker_bonus.pending_bonus_20,
        });
    }

    fn assert_path_not_blocked(
        ref world: dojo::world::WorldStorage, game: Game, token: Token, die_value: u8,
    ) {
        let blocked = is_path_blocked(ref world, game, token, die_value);
        assert(!blocked, 'blocked');
    }

    fn is_path_blocked(
        ref world: dojo::world::WorldStorage, game: Game, token: Token, die_value: u8,
    ) -> bool {
        let track_steps = track_steps_before_home_lane(token, die_value);
        let mut step: u8 = 1;
        loop {
            if step > track_steps {
                break;
            }

            let next_track = wrapped_track_pos(token.track_pos, step.into());
            let owner = track_blockade_owner(ref world, game.game_id, next_track);
            if owner != NO_BLOCKADE_OWNER {
                return true;
            }

            step += 1;
        }

        false
    }

    fn forced_bridge_break_required(
        ref world: dojo::world::WorldStorage, game_id: u64, player: ContractAddress, turn: TurnState,
        dice_state: DiceState,
    ) -> bool {
        if turn.has_moved_token {
            return false;
        }

        if dice_state.die_a_used || dice_state.die_b_used || dice_state.sum_used {
            return false;
        }

        if dice_state.die_a == 0 || dice_state.die_a != dice_state.die_b {
            return false;
        }

        player_has_bridge(ref world, game_id, player)
    }

    fn player_has_bridge(
        ref world: dojo::world::WorldStorage, game_id: u64, player: ContractAddress,
    ) -> bool {
        let mut token_id: u8 = 0;
        loop {
            if token_id >= TOKENS_PER_PLAYER {
                break;
            }

            let token: Token = world.read_model((game_id, player, token_id));
            if token_is_on_player_bridge(ref world, game_id, player, token) {
                return true;
            }

            token_id += 1;
        }

        false
    }

    fn token_is_on_player_bridge(
        ref world: dojo::world::WorldStorage, game_id: u64, player: ContractAddress, token: Token,
    ) -> bool {
        if token.token_state != token_state::ON_TRACK {
            return false;
        }

        count_player_tokens_on_track(ref world, game_id, player, token.track_pos) >= 2
    }

    fn track_blockade_owner(
        ref world: dojo::world::WorldStorage, game_id: u64, track_pos: u16,
    ) -> u8 {
        let mut seat: u8 = 0;
        loop {
            if seat >= MAX_SEATS {
                break;
            }

            let game_seat: GameSeat = world.read_model((game_id, seat));
            if game_seat.occupied {
                let count = count_player_tokens_on_track(ref world, game_id, game_seat.player, track_pos);
                if count >= 2 {
                    return seat;
                }
            }

            seat += 1;
        }

        NO_BLOCKADE_OWNER
    }

    fn count_player_tokens_on_track(
        ref world: dojo::world::WorldStorage, game_id: u64, player: ContractAddress, track_pos: u16,
    ) -> u8 {
        let mut count: u8 = 0;
        let mut token_id: u8 = 0;

        loop {
            if token_id >= TOKENS_PER_PLAYER {
                break;
            }

            let token: Token = world.read_model((game_id, player, token_id));
            if token.token_state == token_state::ON_TRACK && token.track_pos == track_pos {
                count += 1;
            }

            token_id += 1;
        }

        count
    }

    fn recompute_square_occupancy(
        ref world: dojo::world::WorldStorage, game_id: u64, square_ref: u32,
    ) {
        let previous: SquareOccupancy = world.read_model((game_id, square_ref));

        let mut seat_0_count: u8 = 0;
        let mut seat_1_count: u8 = 0;
        let mut seat_2_count: u8 = 0;
        let mut seat_3_count: u8 = 0;

        let mut seat: u8 = 0;
        loop {
            if seat >= MAX_SEATS {
                break;
            }

            let game_seat: GameSeat = world.read_model((game_id, seat));
            if game_seat.occupied {
                let mut count_for_seat: u8 = 0;
                let mut token_id: u8 = 0;
                loop {
                    if token_id >= TOKENS_PER_PLAYER {
                        break;
                    }

                    let token: Token = world.read_model((game_id, game_seat.player, token_id));
                    if square_ref_for_token(seat, token) == square_ref {
                        count_for_seat += 1;
                    }

                    token_id += 1;
                }

                if seat == 0 {
                    seat_0_count = count_for_seat;
                } else if seat == 1 {
                    seat_1_count = count_for_seat;
                } else if seat == 2 {
                    seat_2_count = count_for_seat;
                } else if seat == 3 {
                    seat_3_count = count_for_seat;
                }
            }

            seat += 1;
        }

        let mut has_blockade = false;
        let mut owner = NO_BLOCKADE_OWNER;

        if seat_0_count >= 2 {
            has_blockade = true;
            owner = 0;
        } else if seat_1_count >= 2 {
            has_blockade = true;
            owner = 1;
        } else if seat_2_count >= 2 {
            has_blockade = true;
            owner = 2;
        } else if seat_3_count >= 2 {
            has_blockade = true;
            owner = 3;
        }

        let occupancy = SquareOccupancy {
            game_id,
            square_ref,
            seat_0_count,
            seat_1_count,
            seat_2_count,
            seat_3_count,
            has_blockade,
            blockade_owner_seat: owner,
        };

        world.write_model(@occupancy);

        if !previous.has_blockade && has_blockade {
            let owner_player = player_for_seat(ref world, game_id, owner);
            if owner_player != zero_address() {
                world.emit_event(@BlockadeCreated { game_id, owner: owner_player, square_ref });
                world.emit_event(@BridgeFormed { game_id, owner: owner_player, square_ref });
            }
        }

        if previous.has_blockade && !has_blockade {
            let owner_player = player_for_seat(ref world, game_id, previous.blockade_owner_seat);
            if owner_player != zero_address() {
                world.emit_event(@BlockadeBroken { game_id, owner: owner_player, square_ref });
                world.emit_event(@BridgeBroken { game_id, owner: owner_player, square_ref });
            }
        }
    }

    fn player_for_seat(ref world: dojo::world::WorldStorage, game_id: u64, seat: u8) -> ContractAddress {
        if seat == NO_BLOCKADE_OWNER {
            return zero_address();
        }

        let game_seat: GameSeat = world.read_model((game_id, seat));
        if !game_seat.occupied {
            return zero_address();
        }

        game_seat.player
    }

    fn advance_from_track(ref token: Token, die_value: u8, requires_exact_home: bool) {
        let target_steps: u16 = token.steps_total + die_value.into();
        let center_steps = total_steps_to_center();

        if target_steps <= TRACK_STEPS_TO_HOME_ENTRY {
            token.steps_total = target_steps;
            token.track_pos = wrapped_track_pos(token.track_pos, die_value.into());
            return;
        }

        let track_steps = track_steps_before_home_lane(token, die_value);
        if track_steps > 0 {
            token.track_pos = wrapped_track_pos(token.track_pos, track_steps.into());
        }

        if target_steps < center_steps {
            token.steps_total = target_steps;
            token.token_state = token_state::IN_HOME_LANE;
            token.home_lane_pos = (target_steps - TRACK_STEPS_TO_HOME_ENTRY - 1).try_into().unwrap();
            return;
        }

        if target_steps == center_steps {
            token.steps_total = target_steps;
            token.token_state = token_state::IN_CENTER;
            token.home_lane_pos = HOME_LANE_LEN;
            return;
        }

        if !requires_exact_home {
            token.steps_total = center_steps;
            token.token_state = token_state::IN_CENTER;
            token.home_lane_pos = HOME_LANE_LEN;
            return;
        }

        assert(false, 'exact_goal');
    }

    fn advance_from_home_lane(ref token: Token, die_value: u8, requires_exact_home: bool) {
        let target_home: u16 = token.home_lane_pos.into() + die_value.into();

        if target_home < HOME_LANE_LEN.into() {
            token.home_lane_pos = target_home.try_into().unwrap();
            token.steps_total += die_value.into();
            return;
        }

        if target_home == HOME_LANE_LEN.into() {
            token.home_lane_pos = HOME_LANE_LEN;
            token.steps_total += die_value.into();
            token.token_state = token_state::IN_CENTER;
            return;
        }

        if !requires_exact_home {
            token.home_lane_pos = HOME_LANE_LEN;
            token.steps_total = total_steps_to_center();
            token.token_state = token_state::IN_CENTER;
            return;
        }

        assert(false, 'exact_goal');
    }

    fn preview_advance_from_track(ref token: Token, die_value: u8, requires_exact_home: bool) {
        advance_from_track(ref token, die_value, requires_exact_home);
    }

    fn preview_advance_from_home_lane(ref token: Token, die_value: u8, requires_exact_home: bool) {
        advance_from_home_lane(ref token, die_value, requires_exact_home);
    }

    fn award_capture_bonus(ref bonus_state: BonusState) {
        bonus_state.pending_bonus_20 += 1;
    }

    fn award_home_bonus(ref bonus_state: BonusState) {
        bonus_state.pending_bonus_10 += 1;
    }

    fn total_steps_to_center() -> u16 {
        TRACK_STEPS_TO_HOME_ENTRY + HOME_LANE_LEN.into() + 1_u16
    }

    fn track_steps_before_home_lane(token: Token, steps: u8) -> u8 {
        if token.steps_total >= TRACK_STEPS_TO_HOME_ENTRY {
            return 0;
        }

        let remaining_to_entry: u16 = TRACK_STEPS_TO_HOME_ENTRY - token.steps_total;
        if steps.into() <= remaining_to_entry {
            return steps;
        }

        remaining_to_entry.try_into().unwrap()
    }

    fn path_crosses_track_pos(from_track_pos: u16, steps: u8, target_track_pos: u16) -> bool {
        let mut step: u8 = 1;
        loop {
            if step > steps {
                break;
            }

            let current = wrapped_track_pos(from_track_pos, step.into());
            if current == target_track_pos {
                return true;
            }

            step += 1;
        }

        false
    }

    fn winner_if_any(ref world: dojo::world::WorldStorage, game_id: u64) -> ContractAddress {
        let mut seat: u8 = 0;
        loop {
            if seat >= MAX_SEATS {
                break;
            }

            let game_seat: GameSeat = world.read_model((game_id, seat));
            if game_seat.occupied {
                let player: GamePlayer = world.read_model((game_id, game_seat.player));
                if player.tokens_in_goal >= TOKENS_PER_PLAYER {
                    return game_seat.player;
                }
            }

            seat += 1;
        }

        zero_address()
    }

    fn can_exit_home(rule: u8, die_value: u8) -> bool {
        if rule == 1 {
            return die_value % 2 == 0;
        }

        if rule == 2 {
            return die_value == 6;
        }

        die_value == 5
    }

    fn can_use_single_die_to_exit_home(move_type_value: u8) -> bool {
        move_type_value == move_type::DIE_A || move_type_value == move_type::DIE_B
    }

    fn start_index_for_seat(seat: u8) -> u16 {
        if seat == 0 {
            return 0;
        }
        if seat == 1 {
            return 17;
        }
        if seat == 2 {
            return 34;
        }
        51
    }

    fn is_track_square_safe(ref world: dojo::world::WorldStorage, config_id: u64, track_pos: u16) -> bool {
        let square: BoardSquare = world.read_model((config_id, track_pos));
        if square.config_id == config_id {
            return square.is_safe;
        }

        is_default_safe_track(track_pos)
    }

    fn is_default_safe_track(track_pos: u16) -> bool {
        track_pos == 7
            || track_pos == 12
            || track_pos == 24
            || track_pos == 29
            || track_pos == 41
            || track_pos == 46
            || track_pos == 58
            || track_pos == 63
    }

    fn square_ref_for_token(seat: u8, token: Token) -> u32 {
        if token.token_state == token_state::ON_TRACK {
            return track_square_ref(token.track_pos);
        }

        if token.token_state == token_state::IN_HOME_LANE {
            return 1000 + (seat.into() * 32) + token.home_lane_pos.into();
        }

        if token.token_state == token_state::IN_CENTER {
            return 9000 + seat.into();
        }

        0
    }

    fn track_square_ref(track_pos: u16) -> u32 {
        track_pos.into() + 1
    }

    fn wrapped_track_pos(base: u16, steps: u16) -> u16 {
        let sum = base + steps;
        if sum < MAIN_TRACK_LEN {
            return sum;
        }

        sum - MAIN_TRACK_LEN
    }

    fn reward_for_difficulty(difficulty: u8) -> u32 {
        if difficulty == difficulty_level::EASY {
            return EASY_DIFFICULTY_REWARD_COINS;
        }
        if difficulty == difficulty_level::MEDIUM {
            return MEDIUM_DIFFICULTY_REWARD_COINS;
        }
        HARD_DIFFICULTY_REWARD_COINS
    }

    fn end_turn_and_advance(
        ref world: dojo::world::WorldStorage, ref game: Game, ref turn: TurnState,
        runtime: GameRuntimeConfig, now: u64,
    ) {
        let previous_turn = game.turn_index;
        let next_player = next_active_player(ref world, game.game_id, game.active_player);

        game.turn_index += 1;
        game.active_player = next_player;
        game.updated_at = now;

        let dice_state = DiceState {
            game_id: game.game_id,
            die_a: 0,
            die_b: 0,
            die_a_used: false,
            die_b_used: false,
            sum_used: false,
        };

        let mut next_bonus_state: BonusState = world.read_model((game.game_id, next_player));
        next_bonus_state.bonus_consumed = false;

        turn.phase = turn_phase::ROLL_AND_QUESTION;
        turn.active_player = next_player;
        turn.dice_1 = 0;
        turn.dice_2 = 0;
        turn.die1_used = false;
        turn.die2_used = false;
        turn.question_id = 0;
        turn.question_answered = false;
        turn.question_correct = false;
        turn.has_moved_token = false;
        turn.first_moved_token_id = 0;
        turn.deadline = now + runtime.turn_time_limit_secs.into();

        world.write_model(@game);
        world.write_model(@turn);
        world.write_model(@dice_state);
        world.write_model(@next_bonus_state);
        world.emit_event(@TurnEnded { game_id: game.game_id, turn_index: previous_turn, next_player });
        world.emit_event(@TurnStarted {
            game_id: game.game_id,
            turn_index: game.turn_index,
            active_player: next_player,
        });
    }

    fn next_active_player(
        ref world: dojo::world::WorldStorage, game_id: u64, current: ContractAddress,
    ) -> ContractAddress {
        let current_player: GamePlayer = world.read_model((game_id, current));
        let mut seat = current_player.seat;
        let mut traversed: u8 = 0;

        loop {
            seat = (seat + 1) % MAX_SEATS;
            let game_seat: GameSeat = world.read_model((game_id, seat));
            traversed += 1;

            if game_seat.occupied {
                break game_seat.player;
            }

            assert(traversed <= MAX_SEATS, 'no_players');
        }
    }

    fn make_question_id(turn_index: u32, question_index: u32) -> u64 {
        (turn_index.into() * 1_000_000_u64) + question_index.into()
    }

    fn random_dice_value(random: felt252) -> u8 {
        let random_u256: u256 = random.into();
        let reduced: u256 = random_u256 % 6;
        let dice: u256 = reduced + 1;
        dice.try_into().unwrap()
    }

    fn random_question_index(random: felt252, question_count: u32) -> u32 {
        let random_u256: u256 = random.into();
        let q_count: u256 = question_count.into();
        let reduced: u256 = random_u256 % q_count;
        reduced.try_into().unwrap()
    }

    fn should_skip_question_for_trapped_player(
        ref world: dojo::world::WorldStorage, game_id: u64, player: ContractAddress,
        exit_home_rule: u8, dice_1: u8, dice_2: u8,
    ) -> bool {
        if player_has_token_outside_base(ref world, game_id, player) {
            return false;
        }

        let can_exit_with_die_1 = can_exit_home(exit_home_rule, dice_1);
        let can_exit_with_die_2 = can_exit_home(exit_home_rule, dice_2);
        !can_exit_with_die_1 && !can_exit_with_die_2
    }

    fn player_has_token_outside_base(
        ref world: dojo::world::WorldStorage, game_id: u64, player: ContractAddress,
    ) -> bool {
        let mut token_id: u8 = 0;

        loop {
            if token_id >= TOKENS_PER_PLAYER {
                break;
            }

            let token: Token = world.read_model((game_id, player, token_id));
            if token.token_state != token_state::IN_BASE {
                return true;
            }

            token_id += 1;
        }

        false
    }

    fn build_question_leaf_hash(question_index: u32, category: u8, correct_option: u8) -> felt252 {
        let fields = array![question_index.into(), category.into(), correct_option.into()];

        poseidon_hash_span(fields.span())
    }

    fn verify_merkle_proof(
        mut hash: felt252, mut proof: Array<felt252>, mut directions: Array<u8>, root: felt252,
    ) -> bool {
        loop {
            match proof.pop_front() {
                Option::Some(sibling) => {
                    match directions.pop_front() {
                        Option::Some(direction) => {
                            hash = hash_pair_with_direction(hash, sibling, direction);
                        },
                        Option::None => {
                            return false;
                        },
                    }
                },
                Option::None => {
                    break;
                },
            }
        };

        if directions.len() != 0 {
            return false;
        }

        hash == root
    }

    fn hash_pair_with_direction(current: felt252, sibling: felt252, direction: u8) -> felt252 {
        assert(direction <= 1, 'proof_dir');

        if direction == 0 {
            return poseidon_hash_span(array![current, sibling].span());
        }

        poseidon_hash_span(array![sibling, current].span())
    }

    fn load_vrf_provider_address(ref world: dojo::world::WorldStorage) -> ContractAddress {
        let config: VrfConfig = world.read_model(VRF_CONFIG_SINGLETON_ID);

        if config.singleton_id == VRF_CONFIG_SINGLETON_ID && config.provider_address != zero_address() {
            return config.provider_address;
        }

        DEFAULT_VRF_PROVIDER_ADDRESS.try_into().unwrap()
    }

    fn zero_address() -> ContractAddress {
        0.try_into().unwrap()
    }

    #[cfg(test)]
    mod tests {
        use crate::constants::{bonus_type, move_type, token_state};
        use crate::models::{BonusState, DiceState, GameRuntimeConfig, Token};
        use crate::types::MoveInput;
        use starknet::ContractAddress;
        use super::{
            advance_from_home_lane, advance_from_track, award_capture_bonus, award_home_bonus,
            build_question_leaf_hash, can_exit_home, can_use_single_die_to_exit_home,
            consume_move_resource, hash_pair_with_direction, path_crosses_track_pos,
            verify_merkle_proof, wrapped_track_pos,
        };

        fn zero_address() -> ContractAddress {
            0.try_into().unwrap()
        }

        fn dummy_runtime() -> GameRuntimeConfig {
            GameRuntimeConfig {
                game_id: 1,
                answer_time_limit_secs: 30,
                turn_time_limit_secs: 90,
                exit_home_rule: 0,
                difficulty_level: 0,
            }
        }

        #[test]
        fn spawn_rules_match_modes() {
            assert(can_exit_home(0, 5), 'mode5_valid');
            assert(!can_exit_home(0, 4), 'mode5_invalid');
            assert(can_exit_home(1, 6), 'mode_even_valid');
            assert(can_exit_home(2, 6), 'mode_six_valid');
        }

        fn dummy_bonus() -> BonusState {
            BonusState {
                game_id: 1,
                player: zero_address(),
                pending_bonus_10: 0,
                pending_bonus_20: 0,
                bonus_consumed: false,
            }
        }

        #[test]
        fn exit_rule_stays_classic_five() {
            assert(can_exit_home(0, 5), 'five_required_accepts_5');
            assert(!can_exit_home(0, 6), 'five_required_rejects_6');
        }

        #[test]
        fn exit_home_requires_single_die_resource() {
            assert(can_use_single_die_to_exit_home(move_type::DIE_A), 'die_a_allowed');
            assert(can_use_single_die_to_exit_home(move_type::DIE_B), 'die_b_allowed');
            assert(!can_use_single_die_to_exit_home(move_type::SUM), 'sum_disallowed');
            assert(!can_use_single_die_to_exit_home(move_type::BONUS_10), 'bonus10_disallowed');
            assert(!can_use_single_die_to_exit_home(move_type::BONUS_20), 'bonus20_disallowed');
        }

        #[test]
        fn wrapped_track_wraps_correctly() {
            assert(wrapped_track_pos(67, 1) == 0, 'wrap_fail');
            assert(wrapped_track_pos(60, 5) == 65, 'no_wrap_fail');
            assert(wrapped_track_pos(66, 4) == 2, 'multi_wrap_fail');
        }

        #[test]
        fn bridge_blocks_path_helper() {
            assert(path_crosses_track_pos(10, 4, 13), 'bridge_not_crossed');
            assert(!path_crosses_track_pos(10, 2, 13), 'bridge_false_positive');
        }

        #[test]
        fn capture_awards_plus_20_bonus() {
            let mut bonus = dummy_bonus();
            award_capture_bonus(ref bonus);

            assert(bonus.pending_bonus_20 == 1, 'capture_bonus_missing');
            assert(bonus.pending_bonus_10 == 0, 'unexpected_bonus10');
        }

        #[test]
        fn home_awards_plus_10_bonus() {
            let mut bonus = dummy_bonus();
            award_home_bonus(ref bonus);

            assert(bonus.pending_bonus_10 == 1, 'home_bonus_missing');
            assert(bonus.pending_bonus_20 == 0, 'unexpected_bonus20');
        }

        #[test]
        fn sum_dice_if_enabled_consumes_both_dice() {
            let runtime = dummy_runtime();
            let mut dice = DiceState {
                game_id: 1,
                die_a: 3,
                die_b: 4,
                die_a_used: false,
                die_b_used: false,
                sum_used: false,
            };
            let mut bonus = dummy_bonus();

            let (steps, consumed_bonus) = consume_move_resource(
                runtime,
                ref dice,
                ref bonus,
                MoveInput { move_type: move_type::SUM, token_id: 0, steps: 7 },
            );

            assert(steps == 7, 'sum_steps_bad');
            assert(consumed_bonus == bonus_type::NONE, 'unexpected_bonus');
            assert(dice.sum_used, 'sum_not_used');
            assert(dice.die_a_used, 'die_a_not_used');
            assert(dice.die_b_used, 'die_b_not_used');
        }

        #[test]
        fn exact_home_flag_controls_overshoot_behavior() {
            let mut token = Token {
                game_id: 1,
                player: zero_address(),
                token_id: 0,
                token_state: token_state::ON_TRACK,
                track_pos: 3,
                home_lane_pos: 0,
                steps_total: 70,
            };

            advance_from_track(ref token, 2, false);
            assert(token.token_state == token_state::IN_CENTER, 'center_expected');
            assert(token.steps_total == 71, 'clamped_steps_expected');

            let mut lane_token = Token {
                game_id: 1,
                player: zero_address(),
                token_id: 1,
                token_state: token_state::IN_HOME_LANE,
                track_pos: 0,
                home_lane_pos: 6,
                steps_total: 70,
            };

            advance_from_home_lane(ref lane_token, 2, false);
            assert(lane_token.token_state == token_state::IN_CENTER, 'lane_center_expected');
            assert(lane_token.steps_total == 71, 'lane_clamped_steps_expected');
        }

        #[test]
        fn merkle_verification_with_direction_works() {
            let leaf = build_question_leaf_hash(12, 0, 3);
            let root = hash_pair_with_direction(leaf, 12345, 0);

            let proof = array![12345];
            let directions = array![0];

            let ok = verify_merkle_proof(leaf, proof, directions, root);
            assert(ok, 'proof_invalid');
        }

        #[test]
        fn merkle_verification_rejects_length_mismatch() {
            let leaf = build_question_leaf_hash(0, 0, 1);
            let root = hash_pair_with_direction(leaf, 7, 1);

            let proof = array![7, 8];
            let directions = array![1];

            let ok = verify_merkle_proof(leaf, proof, directions, root);
            assert(!ok, 'proof_should_fail');
        }
    }
}
