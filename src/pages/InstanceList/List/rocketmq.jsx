import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { Button, Message, Dialog } from '@alicloud/console-components';
import Actions, { LinkButton } from '@alicloud/console-components-actions';
import Table from '@/components/MidTable';
import styles from './list.module.scss';

import { getMiddlewareList, deleteMiddleware } from '@/services/middleware';
import transTime from '@/utils/transTime';
import messageConfig from '@/components/messageConfig';
import timerClass from '@/utils/timerClass';
import { statusRender } from '@/utils/utils';

function RocketMQList(props) {
	const { cluster: globalCluster, namespace: globalNamespace } =
		props.globalVar;
	const { instance, updateList } = props;
	const history = useHistory();
	const [dataSource, setDataSource] = useState([]);
	const [originData, setOriginData] = useState([]);
	const [keyword, setKeyword] = useState('');
	let [timer, setTimer] = useState(null);

	const states = [
		{ value: 'Creating', label: '启动中' },
		{ value: 'Running', label: '运行正常' },
		{ value: 'Other', label: '运行异常' }
	];

	const getData = async (clusterId, namespace, keyword) => {
		let res = await getMiddlewareList({
			clusterId,
			namespace,
			type: 'rocketmq',
			keyword
		});
		if (res.success) {
			let tempArray = res.data.map((item) => ({
				...item,
				createTimeNum: new Date(item.createTime).getTime(),
				createTime: transTime.gmt2local(item.createTime)
			}));
			setDataSource(tempArray);
			setOriginData(tempArray);
		}
	};

	const refreshFn = () => {
		updateList();
	};

	const deleteFn = (name) => {
		Dialog.show({
			title: '提示',
			content: '确定删除该RocketMQ服务？',
			onOk: async () => {
				let res = await deleteMiddleware({
					clusterId: globalCluster.id,
					namespace: globalNamespace.name,
					middlewareName: name,
					type: 'rocketmq'
				});
				if (res.success) {
					Message.show({
						type: 'success',
						title: <div>成功</div>,
						content: (
							<div className="message-box">
								<p>删除中, 3s 后获取数据</p>
							</div>
						),
						duration: 3000,
						align: 'tr tr',
						closeable: true,
						offset: [-24, 62]
					});
					setTimer(
						timerClass.countdownTimer(() => {
							refreshFn();
						}, 3)
					);
				} else {
					Message.show(messageConfig('error', '失败', res));
				}
			}
		});
	};

	const Operation = {
		primary: (
			<Button
				onClick={() =>
					history.push(
						`/serviceCatalog/rocketmqCreate/${instance.chartName}/${instance.chartVersion}`
					)
				}
				type="primary"
			>
				发布服务
			</Button>
		)
	};

	const handleSearch = (value) => {
		setKeyword(value);
		getData(globalCluster.id, globalNamespace.name, value);
	};

	const onFilter = (filterParams) => {
		let {
			status: { selectedKeys }
		} = filterParams;
		if (selectedKeys.length === 0) {
			setDataSource(originData);
		} else {
			let tempData = null;
			if (selectedKeys[0] !== 'Other') {
				tempData = originData.filter((item) => {
					return item.status === selectedKeys[0];
				});
			} else if (selectedKeys[0] === 'Other') {
				tempData = originData.filter((item) => {
					return (
						item.status !== 'Running' && item.status !== 'Creating'
					);
				});
			}
			setDataSource(tempData);
		}
	};

	const onSort = (dataIndex, order) => {
		if (dataIndex === 'createTime') {
			let tempDataSource = originData.sort((a, b) => {
				const result = a['createTimeNum'] - b['createTimeNum'];
				return order === 'asc'
					? result > 0
						? 1
						: -1
					: result > 0
					? -1
					: 1;
			});
			setDataSource([...tempDataSource]);
		}
	};

	const nameRender = (value, index, record) => {
		return (
			<>
				<div
					className="name-link"
					onClick={() =>
						history.push(
							`/instanceList/detail/${record.name}/${record.type}/${instance.chartVersion}`
						)
					}
				>
					{record.name}
				</div>
				<div>{record.aliasName}</div>
			</>
		);
	};

	const actionRender = (value, index, record) => {
		return (
			<Actions>
				<LinkButton
					onClick={() =>
						history.push(
							`/instanceList/detail/${record.name}/${record.type}/${instance.chartVersion}`
						)
					}
				>
					管理
				</LinkButton>
				<LinkButton
					onClick={() =>
						history.push({
							pathname: `/instanceList/detail/${record.name}/${record.type}/${instance.chartVersion}`,
							query: { key: 'monitor' }
						})
					}
				>
					监控
				</LinkButton>
				<LinkButton onClick={() => deleteFn(record.name)}>
					删除
				</LinkButton>
			</Actions>
		);
	};

	// 全局分区更新
	useEffect(() => {
		if (JSON.stringify(globalNamespace) !== '{}' && instance) {
			getData(globalCluster.id, globalNamespace.name, keyword);
		}
	}, [globalNamespace, instance]);

	useEffect(() => {
		return () => clearInterval(timer);
	}, []);

	return (
		<>
			<div className={styles['header-tips']}>
				高可用RocketMQ使用说明
				<br />
				<span style={{ fontWeight: 400 }}>
					当前RocketMQ 是基于Apache
					RocketMQ构建的低延迟、高并发、高可用、高可靠的分布式消息中间件，并提供了故障自愈，运维监控等能力，版本支持4.1.0；详细参见
				</span>
				<span
					className="name-link"
					onClick={() =>
						window.open(
							'https://www.yuque.com/nq4era/chqywm/svlo5b',
							'_blank'
						)
					}
				>
					《高可用RocketMQ使用说明》
				</span>
			</div>
			<Table
				dataSource={dataSource}
				exact
				fixedBarExpandWidth={[24]}
				affixActionBar
				showColumnSetting
				showRefresh
				onRefresh={refreshFn}
				primaryKey="key"
				operation={Operation}
				search={{
					onSearch: handleSearch,
					placeholder: '请输入搜索内容'
				}}
				onFilter={onFilter}
				onSort={onSort}
			>
				<Table.Column
					title="服务名称/显示名称"
					dataIndex="name"
					resizable
					cell={nameRender}
				/>
				<Table.Column
					title="状态"
					dataIndex="status"
					cell={statusRender}
					filters={states}
					filterMode="single"
				/>
				<Table.Column
					title="创建时间"
					dataIndex="createTime"
					sortable={true}
				/>
				<Table.Column title="备注" dataIndex="annotation" />
				<Table.Column
					title="操作"
					dataIndex="action"
					cell={actionRender}
					width={188}
					lock="right"
				/>
			</Table>
		</>
	);
}

export default connect(({ globalVar }) => ({ globalVar }), {})(RocketMQList);
