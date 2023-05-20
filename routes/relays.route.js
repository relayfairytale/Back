const express = require('express');
const { Users, Stories, Relays, Likes, Sequelize } = require('../models');
const router = express.Router();
const auth = require('../middlewares/auth-middleware');

/**
 * @swagger
 * /stories/{storyId}/relay:
 *   post:
 *     summary: 문장 작성 API
 *     description: 동화에 새로운 문장을 작성하여 이어붙이는 API입니다.
 *     parameters:
 *       - in: path
 *         name: storyId
 *         description: 문장을 이어붙일 동화의 ID
 *         required: true
 *         schema:
 *           type: integer
 *       - in: body
 *         name: content
 *         description: 이어쓰는 문장 내용
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             content:
 *               type: string
 *     responses:
 *       201:
 *         description: 문장 작성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 성공 메시지
 *       412:
 *         description: 잘못된 데이터 형식
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMessage:
 *                   type: string
 *                   description: 오류 메시지
 *       403:
 *         description: 동화 완료로 인한 작성 제한
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMessage:
 *                   type: string
 *                   description: 오류 메시지
 *       404:
 *         description: 동화 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMessage:
 *                   type: string
 *                   description: 오류 메시지
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMessage:
 *                   type: string
 *                   description: 오류 메시지
 */
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
    console.log(userId, story.newWriting);
    try {
        if (userId.toString() === story.newWriting) {
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
        } else {
            return res
                .status(403)
                .json({ errorMessage: '작성 권한이 없습니다.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({
            errorMessage: '알 수 없는 오류가 발생하여 작성을 실패했습니다.',
        });
    }
});

/**
 * @swagger
 * /stories/{storyId}/relay/isWriting:
 *   post:
 *     summary: Indicate that a user is currently writing a story.
 *     description: This endpoint is used to indicate that a user has started writing a story.
 *     tags:
 *       - Relay
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         description: The ID of the story.
 *         schema:
 *           type: string
 *       - in: header
 *         name: Authorization
 *         required: true
 *         description: Access token for authentication.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful operation. The user has started writing the story.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A success message indicating that the writing has started.
 *                   example: '글 작성을 시작하였습니다.'
 *       409:
 *         description: Conflict. Another user is currently writing the story.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMessage:
 *                   type: string
 *                   description: An error message indicating that another user is currently writing the story.
 *                   example: '다른 사용자가 작성 중입니다.'
 */
router.post('/:storyId/relay/isWriting', auth, async (req, res) => {
    const { storyId } = req.params;
    const { userId } = res.locals.user;
    const story = await Stories.findOne({ where: { storyId } });
    if (story.newWriting === userId.toString()) {
        res.status(200).json({ message: '글 작성을 시작하였습니다.' });
    }
    if (story.newWriting) {
        return res
            .status(409)
            .json({ errorMessage: '다른 사용자가 작성 중입니다.' });
    } else {
        story.newWriting = userId;
        story.writingTime = new Date();
        await story.save();
        res.status(200).json({ message: '글 작성을 시작하였습니다.' });
    }
});

// 주기적으로 글 작성 중인지 확인 10분 마다
setInterval(async (check_interval) => {
    const stories = await Stories.findAll({
        where: {
            newWriting: { [Sequelize.Op.ne]: null },
            writingTime: {
                [Sequelize.Op.lte]: new Date(Date.now() - 60 * 10 * 1000),
            },
        },
    });
    stories.forEach(async (story) => {
        console.log(story.storyId, story.UserId, story.newWriting);
        story.newWriting = null;
        story.writingTime = null;
        await story.save();
        console.log(story.storyId, story.UserId, story.newWriting);
    });
}, 60 * 10 * 1000);

/**
 * @swagger
 * /stories/{storyId}/relay/{relayId}:
 *   get:
 *     summary: 문장 내용 보기 API
 *     description: 특정 이어쓴 문장의 내용을 조회하는 API입니다.
 *     parameters:
 *       - in: path
 *         name: storyId
 *         description: 문장이 이어진 동화의 ID
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: relayId
 *         description: 조회할 이어쓴 문장의 ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 문장 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 relay:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: string
 *                       description: 이어쓴 사용자의 닉네임
 *                     like:
 *                       type: boolean
 *                       description: 해당 이어쓴 문장에 좋아요를 누른 여부
 *       404:
 *         description: 동화 또는 이어쓴 문장 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMessage:
 *                   type: string
 *                   description: 오류 메시지
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMessage:
 *                   type: string
 *                   description: 오류 메시지
 */
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
        return res.status(200).json({
            relay: { user: user.nickname, like: like ? true : false },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            errorMessage: '알 수 없는 오류가 발생하여 조회를 실패했습니다.',
        });
    }
});

/**
 * @swagger
 * /stories/{storyId}/relay/{relayId}:
 *   put:
 *     summary: 문장 수정 API
 *     description: 특정 이어쓴 문장을 수정하는 API입니다.
 *     parameters:
 *       - in: path
 *         name: storyId
 *         description: 문장이 이어진 동화의 ID
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: relayId
 *         description: 수정할 이어쓴 문장의 ID
 *         required: true
 *         schema:
 *           type: string
 *       - in: body
 *         name: content
 *         description: 이어쓰는 문장 수정 내용
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             content:
 *               type: string
 *     responses:
 *       200:
 *         description: 문장 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 성공 메시지
 *       412:
 *         description: 잘못된 데이터 형식
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMessage:
 *                   type: string
 *                   description: 오류 메시지
 *       403:
 *         description: 수정 권한 없음 또는 마지막 문장 외의 수정 시도
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMessage:
 *                   type: string
 *                   description: 오류 메시지
 *       404:
 *         description: 동화 또는 이어쓴 문장 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMessage:
 *                   type: string
 *                   description: 오류 메시지
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMessage:
 *                   type: string
 *                   description: 오류 메시지
 */
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

/**
 * @swagger
 * /stories/{storyId}/relay/{relayId}:
 *   delete:
 *     summary: 문장 삭제 API
 *     description: 특정 이어쓴 문장을 삭제하는 API입니다.
 *     parameters:
 *       - in: path
 *         name: storyId
 *         description: 문장이 이어진 동화의 ID
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: relayId
 *         description: 삭제할 이어쓴 문장의 ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 문장 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 성공 메시지
 *       403:
 *         description: 삭제 권한 없음 또는 마지막 문장 외의 삭제 시도
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMessage:
 *                   type: string
 *                   description: 오류 메시지
 *       404:
 *         description: 동화 또는 이어쓴 문장 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMessage:
 *                   type: string
 *                   description: 오류 메시지
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMessage:
 *                   type: string
 *                   description: 오류 메시지
 */
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
