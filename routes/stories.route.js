const express = require('express');
const { Stories, Users, Relays } = require('../models');
const authMiddleware = require('../middlewares/auth-middleware');
const router = express.Router();

/**
 * @swagger
 * /stories:
 *   get:
 *     summary: 전체 동화 조회 API
 *     description: 전체 동화를 조회하는 API입니다.
 *     responses:
 *       200:
 *         description: OK
 *         schema:
 *           type: object
 *           properties:
 *             stories:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   storyId:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   content:
 *                     type: string
 *                   imageURL:
 *                     type: string
 *                   isFinished:
 *                     type: boolean
 *                   likeCount:
 *                     type: integer
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   User:
 *                     type: object
 *                     properties:
 *                       nickname:
 *                         type: string
 */
router.get('/stories', async (req, res) => {
    const stories = await Stories.findAll({
        attributes: ['storyId', 'title', 'content', 'imageURL', 'isFinished', 'likeCount', 'createdAt', 'updatedAt'],
        include: [
            {
                model: Users,
                attributes: ['nickname'],
            },
        ],
        order: [['createdAt', 'DESC']],
    });
    res.status(200).json({ stories });
});

/**
 * @swagger
 * /stories:
 *   post:
 *     summary: 동화 작성 API
 *     description: 새로운 동화를 작성하는 API입니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: body
 *         name: story
 *         description: 동화 작성 데이터
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             title:
 *               type: string
 *             content:
 *               type: string
 *             imageURL:
 *               type: string
 *     responses:
 *       201:
 *         description: 동화 작성 성공
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *       400:
 *         description: 동화 작성 실패
 *         schema:
 *           type: object
 *           properties:
 *             errorMessage:
 *               type: string
 */
router.post('/stories', authMiddleware, async (req, res) => {
    const { title, content, imageURL } = req.body;
    const { userId } = res.locals.user;

    const likeCount = 0;
    try {
        await Stories.create({ title, content, imageURL, UserId: userId, likeCount });

        return res.status(201).json({ message: '새로운 동화를 작성하였습니다.' });
    } catch (err) {
        console.error(err);
        res.status(400).json({ errorMessage: '새로운 동화 작성에 실패하였습니다.' });
    }
});

/**
 * @swagger
 * /stories/{storyId}:
 *   put:
 *     summary: 동화 수정 API
 *     description: 동화를 수정하는 API입니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storyId
 *         description: 동화 ID
 *         required: true
 *         schema:
 *           type: integer
 *       - in: body
 *         name: story
 *         description: 동화 정보
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             title:
 *               type: string
 *             content:
 *               type: string
 *             imageURL:
 *               type: string
 *     responses:
 *       200:
 *         description: 동화 수정 성공
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *       400:
 *         description: 동화 수정 실패
 *         schema:
 *           type: object
 *           properties:
 *             errorMessage:
 *               type: string
 *       403:
 *         description: 수정 권한 없음
 *         schema:
 *           type: object
 *           properties:
 *             errorMessage:
 *               type: string
 *       404:
 *         description: 존재하지 않는 동화
 *         schema:
 *           type: object
 *           properties:
 *             errorMessage:
 *               type: string
 */
router.put('/stories/:storyId', authMiddleware, async (req, res) => {
    const { storyId } = req.params;
    const { title, content, imageURL } = req.body;
    const { userId } = res.locals.user;

    try {
        const story = await Stories.findOne({ where: { storyId } });
        if (!story) {
            return res.status(404).json({ errorMessage: '존재하지 않는 동화입니다.' });
        }

        // admin 계정은 모든 동화를 수정할 수 있음
        // userId가 4인 계정은 admin 계정임
        if (userId !== 4) {
            return res.status(403).json({ errorMessage: '수정 권한이 없습니다.' });
        }

        await Stories.update({ title, content, imageURL }, { where: { storyId } });

        return res.status(200).json({ message: '동화를 수정하였습니다.' });
    } catch (err) {
        console.error(err);
        res.status(400).json({ errorMessage: '동화 수정에 실패하였습니다.' });
    }
});

/**
 * @swagger
 * /stories/{storyId}:
 *   delete:
 *     summary: 동화 삭제 API
 *     description: 동화를 삭제하는 API입니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storyId
 *         description: 동화 ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 동화 삭제 성공
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *       400:
 *         description: 동화 삭제 실패
 *         schema:
 *           type: object
 *           properties:
 *             errorMessage:
 *               type: string
 *       403:
 *         description: 삭제 권한 없음
 *         schema:
 *           type: object
 *           properties:
 *             errorMessage:
 *               type: string
 *       404:
 *         description: 존재하지 않는 동화
 *         schema:
 *           type: object
 *           properties:
 *             errorMessage:
 *               type: string
 */  
router.delete('/stories/:storyId', authMiddleware, async (req, res) => {
    const { storyId } = req.params;
    const { userId } = res.locals.user;

    try {
        const story = await Stories.findOne({ where: { storyId } });
        if (!story) {
            return res.status(404).json({ errorMessage: '존재하지 않는 동화입니다.' });
        }

        // admin 계정은 모든 동화를 삭제할 수 있음
        // userId가 4인 계정은 admin 계정임
        if (userId !== 4) {
            return res.status(403).json({ errorMessage: '삭제 권한이 없습니다.' });
        }

        await Stories.destroy({ where: { storyId } });

        return res.status(200).json({ message: '동화를 삭제하였습니다.' });
    } catch (err) {
        console.error(err);
        res.status(400).json({ errorMessage: '동화 삭제에 실패하였습니다.' });
    }
});

/**
 * @swagger
 * /stories/{storyId}:
 *   get:
 *     summary: 동화 상세 조회 API
 *     description: 특정 동화의 상세 정보를 조회하는 API입니다.
 *     parameters:
 *       - in: path
 *         name: storyId
 *         description: 동화 ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 성공적으로 조회된 동화 데이터
 *         schema:
 *           type: object
 *           properties:
 *             story:
 *               type: object
 *               properties:
 *                 storyId:
 *                   type: integer
 *                 title:
 *                   type: string
 *                 content:
 *                   type: string
 *                 imageURL:
 *                   type: string
 *                 isFinished:
 *                   type: boolean
 *                 like:
 *                   type: integer
 *                 relays:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       relayId:
 *                         type: integer
 *                       content:
 *                         type: string
 *                       likeCount:
 *                         type: integer
 *                       user:
 *                         type: string
 *       404:
 *         description: 존재하지 않는 동화
 *         schema:
 *           type: object
 *           properties:
 *             errorMessage:
 *               type: string
 *       400:
 *         description: 동화 상세 조회 실패
 *         schema:
 *           type: object
 *           properties:
 *             errorMessage:
 *               type: string
 */
router.get('/stories/:storyId', async (req, res) => {
    const { storyId } = req.params;

    try {
        const story = await Stories.findOne({
            where: { storyId },
            attributes: ['storyId', 'title', 'content', 'imageURL', 'isFinished', 'likeCount', 'createdAt', 'updatedAt'],
            include: [
                {
                    model: Users,
                    attributes: ['nickname'],
                },
                {
                    model: Relays,
                    attributes: ['relayId', 'content', 'likeCount'],
                },
            ],
        });
        if (!story) {
            return res.status(404).json({ errorMessage: '존재하지 않는 동화입니다.' });
        }

        return res.status(200).json({ story });
    } catch (err) {
        console.error(err);
        res.status(400).json({ errorMessage: '동화 상세 조회에 실패하였습니다.' });
    }
});

module.exports = router;
