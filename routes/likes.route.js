const express = require('express');
const { Users, Stories, Relays, Likes, Sequelize } = require('../models');
const router = express.Router();
const auth = require('../middlewares/auth-middleware');

// 동화 좋아요 API
router.put('/:storyId/like', auth, async (req, res) => {
    // 동화 존재 여부 확인
    const { storyId } = req.params;
    const story = await Stories.findOne({ where: { storyId } });
    if (!story) {
        return res
            .status(404)
            .json({ errorMessage: '동화를 찾을 수 없습니다.' });
    }
    // 좋아요 토글
    const { userId } = res.locals.user;
    try {
        const like = await Likes.findOne({
            where: { StoryId: storyId, UserId: userId },
        });
        // 좋아요 없다면
        if (!like) {
            // 좋아요 추가
            await Likes.create({ StoryId: storyId, UserId: userId });
            // 좋아요 카운트 +1
            const likeCount = Number(story.likeCount) + 1;
            // Stories 수정
            await Stories.Update({ likeCount }, { where: { storyId } });
            return res.status(200).json({ message: 'Liked' });
        } else {
            // 좋아요 있다면, 제거
            await Likes.destroy({
                where: { StoryId: storyId, UserId: userId },
            });
            // 좋아요 카운트 -1
            const likeCount = Number(story.likeCount) - 1;
            // Stories 수정
            await Stories.Update({ likeCount }, { where: { storyId } });
            return res.status(200).json({ message: 'Like canceled' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            errorMessage: '알 수 없는 오류가 발생하여 작업을 실패했습니다.',
        });
    }
});

// 이어쓴 문장 좋아요 API
router.put('/:storyId/relay/:relayId/like', auth, async (req, res) => {
    // 동화 존재 여부 확인
    const { storyId } = req.params;
    const story = await Stories.findOne({ where: { storyId } });
    if (!story) {
        return res
            .status(404)
            .json({ errorMessage: '동화를 찾을 수 없습니다.' });
    }

    // 이어쓴 문장 존재 여부 확인
    const { relayId } = req.params;
    const relay = await Relays.findOne({ where: { relayId } });
    if (!relay) {
        return res
            .status(404)
            .json({ errorMessage: '이어쓴 문장을 찾을 수 없습니다' });
    }

    // 좋아요 토글
    const { userId } = res.locals.user;
    try {
        const like = await Likes.findOne({
            where: { StoryId: storyId, UserId: userId, RelayId: relayId },
        });
        // 자료가 없다면
        if (!like) {
            // 좋아요 추가
            await Likes.create({
                StoryId: storyId,
                UserId: userId,
                RelayId: relayId,
            });
            // 좋아요 카운트 +1
            const likeCount = Number(relay.likeCount) + 1;
            // Relays 수정
            await Relays.Update({ likeCount }, { where: { relayId } });
            return res.status(200).json({ message: 'Liked' });
        } else {
            // 자료가 있다면,
            if (like.isLike) {
                // 자료가 좋아요라면, 기록 삭제
                await Likes.destroy({
                    where: {
                        StoryId: storyId,
                        UserId: userId,
                        RelayId: relayId,
                    },
                });
                // 좋아요 카운트 -1
                const likeCount = Number(story.likeCount) - 1;
                // Relays 수정
                await Relays.Update({ likeCount }, { where: { relayId } });
                return res.status(200).json({ message: 'Like canceled' });
            } else {
                // 자료가 싫어요라면, 기록 변경
                await Likes.update(
                    { isLike: true },
                    { where: { likeId: like.likeId } }
                );
                // 좋아요 카운트 + 2 (싫어요 -1 → 좋아요 +1 => +2)
                const likeCount = Number(story.likeCount) + 2;
                // Relays 수정
                await Relays.Update({ likeCount }, { where: { relayId } });
                return res.status(200).json({ message: 'Like canceled' });
            }
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            errorMessage: '알 수 없는 오류가 발생하여 작업을 실패했습니다.',
        });
    }
});

// 이어쓴 문장 싫어요 API
router.put('/:storyId/relay/:relayId/dislike', auth, async (req, res) => {
    // 동화 존재 여부 확인
    const { storyId } = req.params;
    const story = await Stories.findOne({ where: { storyId } });
    if (!story) {
        return res
            .status(404)
            .json({ errorMessage: '동화를 찾을 수 없습니다.' });
    }

    // 이어쓴 문장 존재 여부 확인
    const { relayId } = req.params;
    const relay = await Relays.findOne({ where: { relayId } });
    if (!relay) {
        return res
            .status(404)
            .json({ errorMessage: '이어쓴 문장을 찾을 수 없습니다' });
    }

    // 좋아요 토글
    const { userId } = res.locals.user;
    try {
        const like = await Likes.findOne({
            where: { StoryId: storyId, UserId: userId, RelayId: relayId },
        });
        // 자료가 없다면
        if (!like) {
            // 싫어요 추가
            await Likes.create({
                StoryId: storyId,
                UserId: userId,
                RelayId: relayId,
                isLike: false,
            });
            // 좋아요 카운트 -1
            const likeCount = Number(relay.likeCount) - 1;
            // Relays 수정
            await Relays.Update({ likeCount }, { where: { relayId } });
            return res.status(200).json({ message: 'Liked' });
        } else {
            // 자료가 있다면,
            if (like.isLike) {
                // 자료가 좋아요라면, 기록 변경
                await Likes.update(
                    { isLike: false },
                    { where: { likeId: like.likeId } }
                );
                // 좋아요 카운트 - 2 (좋아요 +1 → 싫어요 -1 => -2)
                const likeCount = Number(story.likeCount) - 2;
                // Relays 수정
                await Relays.Update({ likeCount }, { where: { relayId } });
                return res.status(200).json({ message: 'Like canceled' });
            } else {
                // 자료가 싫어요라면, 기록 삭제
                await Likes.destroy({
                    where: {
                        StoryId: storyId,
                        UserId: userId,
                        RelayId: relayId,
                    },
                });
                // 좋아요 카운트 +1
                const likeCount = Number(story.likeCount) + 1;
                // Relays 수정
                await Relays.Update({ likeCount }, { where: { relayId } });
                return res.status(200).json({ message: 'Like canceled' });
            }
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            errorMessage: '알 수 없는 오류가 발생하여 작업을 실패했습니다.',
        });
    }
});

module.exports = router;
