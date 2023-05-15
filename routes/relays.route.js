const express = require('express');
const { Users, Stories, Relays, Likes, Sequelize } = require('../models');
const router = express.Router();
const auth = require('../middlewares/auth-middleware');

// 글 작성 시작
router.post('/:storyId/isWriting', auth, async (req, res) => {
    const { storyId } = req.params;
    const { userId } = res.locals.user;
    const story = await Stories.findOne({ where: { storyId } });
    if (story.newWriting) {
        return res.status(409).json({ errorMessage: '다른 사용자가 작성 중입니다.' });
    }
    story.newWriting = userId;
    story.writingTime = new Date();
    await story.save();
    res.status(200).json({ message: '글 작성을 시작하였습니다.' });
});

// 문장 잇기 API
router.post('/:storyId/relay', auth, async (req, res) => {
    // 작성 데이터 존재 여부 확인
    const { content } = req.body;
    if (!content) {
        return res
            .status(412)
            .json({ errorMessage: '데이터 형식이 올바르지 않습니다.' });
    }

    // 동화 존재 여부 확인
    const { storyId } = req.params;
    const story = await Stories.findOne({ where: { storyId } });
    if (!story) {
        return res
            .status(404)
            .json({ errorMessage: '동화를 찾을 수 없습니다' });
    }
    // 동화 완료 여부 확인
    if (story.isFinished) {
        return res
            .status(403)
            .json({ errorMessage: '동화가 완료되어 추가할 수 없습니다.' });
    }

    // 문장 잇기 기록
    const { userId } = res.locals.user;
    try {
        await Relays.create({
            content,
            StoryId: storyId,
            UserId: userId,
            likeCount: 0,
        });
        story.newWriting = null;
        story.writingTime = null;
        await story.save();
        return res.status(201).json({ message: 'created' });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            errorMessage: '알 수 없는 오류가 발생하여 작성을 실패했습니다.',
        });
    }
});

// 주기적으로 글 작성 중인지 확인 1시간마다
setInterval(async () => {
    const stories = await Stories.findAll({
        where: {
            newWriting: { [Sequelize.Op.ne]: null },
            writingTime: { [Sequelize.Op.lte]: new Date(Date.now() - 60 * 60 * 1000) },
        },
    });
    stories.forEach(async (story) => {
        story.newWriting = null;
        story.writingTime = null;
        await story.save();
    });
}, 60 * 60 * 1000);

// 문장 내용 보기 API
router.get('/:storyId/relay/:relayId', auth, async (req, res) => {
    try {
        // 동화 존재 여부 확인
        const { storyId } = req.params;
        const story = await Stories.findOne({ where: { storyId } });
        if (!story) {
            return res
                .status(404)
                .json({ errorMessage: '동화를 찾을 수 없습니다' });
        }

        // 이어쓴 문장 존재 여부 확인
        const { relayId } = req.params;
        const relay = await Relays.findOne({ where: { relayId } });
        if (!relay) {
            return res
                .status(404)
                .json({ errorMessage: '이어쓴 문장을 찾을 수 없습니다' });
        }

        // like 여부 확인 후 회신
        const { userId } = res.locals.user;
        const user = await Users.findOne({ where: { userId } });
        const like = await Likes.findOne({
            where: { RelayId: relayId, UserId: userId },
        });
        return res
            .status(200)
            .json({
                relay: { user: user.nickname, like: like ? true : false },
            });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            errorMessage: '알 수 없는 오류가 발생하여 조회를 실패했습니다.',
        });
    }
});

// 문장 수정 API
// 마지막 문장만 수정 가능
router.put('/:storyId/relay/:relayId', auth, async (req, res) => {
    // 수정 데이터 존재 여부 확인
    const { content } = req.body;
    if (!content) {
        return res
            .status(412)
            .json({ errorMessage: '데이터 형식이 올바르지 않습니다.' });
    }

    // 동화 존재 여부 확인
    const { storyId } = req.params;
    const story = await Stories.findOne({ where: { storyId } });
    if (!story) {
        return res
            .status(404)
            .json({ errorMessage: '동화를 찾을 수 없습니다' });
    }
    // 동화 완료 여부 확인
    if (story.isFinished) {
        return res
            .status(403)
            .json({ errorMessage: '동화가 완료되어 수정할 수 없습니다.' });
    }

    // 이어쓴 문장 존재 여부 확인
    const { relayId } = req.params;
    const relay = await Relays.findOne({ where: { relayId } });
    if (!relay) {
        return res
            .status(404)
            .json({ errorMessage: '이어쓴 문장을 찾을 수 없습니다' });
    }
    // 이어쓴 문장 권한 확인
    const { userId } = res.locals.user;
    if (relay.UserId !== userId) {
        return res.status(403).json({ errorMessage: '수정 권한이 없습니다.' });
    }

    // 이어쓴 문장이 가장 마지막 문장인지 확인
    const lastRelay = await Relays.findOne({ order: [['relayId', 'DESC']] });
    if (lastRelay.relayId !== relay.relayId) {
        return res
            .status(403)
            .json({ errorMessage: '마지막 문장 외에는 수정할 수 없습니다.' });
    }

    // 이어쓴 문장 수정
    try {
        await Relays.update({ content }, { where: { relayId } });
        return res.status(200).json({ message: 'updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            errorMessage: '알 수 없는 오류가 발생하여 수정을 실패했습니다.',
        });
    }
});

// 문장 삭제 API
// 마지막 문장만 삭제 가능
router.delete('/:storyId/relay/:relayId', auth, async (req, res) => {
    // 동화 존재 여부 확인
    const { storyId } = req.params;
    const story = await Stories.findOne({ where: { storyId } });
    if (!story) {
        return res
            .status(404)
            .json({ errorMessage: '동화를 찾을 수 없습니다' });
    }
    // 동화 완료 여부 확인
    if (story.isFinished) {
        return res
            .status(403)
            .json({ errorMessage: '동화가 완료되어 삭제할 수 없습니다.' });
    }

    // 이어쓴 문장 존재 여부 확인
    const { relayId } = req.params;
    const relay = await Relays.findOne({ where: { relayId } });
    if (!relay) {
        return res
            .status(404)
            .json({ errorMessage: '이어쓴 문장을 찾을 수 없습니다' });
    }
    // 이어쓴 문장 권한 확인
    const { userId } = res.locals.user;
    if (relay.UserId !== userId) {
        return res.status(403).json({ errorMessage: '삭제 권한이 없습니다.' });
    }
    // 이어쓴 문장이 가장 마지막 문장인지 확인
    const lastRelay = await Relays.findOne({ order: [['relayId', 'DESC']] });
    if (lastRelay.relayId !== relay.relayId) {
        return res
            .status(403)
            .json({ errorMessage: '마지막 문장 외에는 삭제할 수 없습니다.' });
    }

    // 이어쓴 문장 삭제
    try {
        await Relays.destroy({ where: { relayId } });
        return res.status(200).json({ message: 'deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            errorMessage: '알 수 없는 오류가 발생하여 삭제를 실패했습니다.',
        });
    }
});

module.exports = router;
